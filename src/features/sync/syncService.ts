import { db } from '@/db/db';
import type { TrackableItem, AppSettings } from '@/types';
import { createClient } from 'webdav';

const BACKUP_DIR = 'NextTracker';
const BACKUP_FILENAME = `${BACKUP_DIR}/nexttracker_backup.json`;

export const syncService = {
    async exportToJSON() {
        const items = await db.items.toArray();
        const data = JSON.stringify(items, null, 2);

        // Trigger browser download
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexttracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return items.length;
    },

    async importFromJSON(file: File): Promise<number> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const result = e.target?.result as string;
                    if (!result) throw new Error('File is empty');

                    const items: TrackableItem[] = JSON.parse(result);
                    if (!Array.isArray(items)) throw new Error('Invalid backup file format');

                    await db.transaction('rw', db.items, async () => {
                        await db.items.clear();
                        await db.items.bulkAdd(items);
                    });

                    resolve(items.length);
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },

    async getWebDAVClient(settings: AppSettings) {
        if (!settings.nextcloudUrl || !settings.nextcloudUsername || !settings.nextcloudPassword) {
            throw new Error('Nextcloud settings are missing');
        }

        let targetUrl = settings.nextcloudUrl.trim();

        // Detection for UI vs WebDAV URL
        if (targetUrl.includes('index.php/apps/files')) {
            throw new Error('Hatalı URL: Girdiğiniz adres Nextcloud arayüz adresidir. Lütfen "Ayarlar > WebDAV" kısmındaki doğru adresi (remote.php/dav/...) kullanın.');
        }

        // Stronger validation: require remote.php/dav path (common Nextcloud WebDAV pattern)
        if (!/remote\.php\/dav\/files\//.test(targetUrl)) {
            throw new Error('Hatalı WebDAV adresi. Örnek format: https://sunucu.com/remote.php/dav/files/kullanici/');
        }

        // Normalize URL: Must end with /
        if (!targetUrl.endsWith('/')) {
            targetUrl += '/';
        }

        // Use local proxy to avoid CORS issues - with absolute URL for reliability
        const proxyUrl = `${window.location.origin}/api/proxy`;

        return createClient(proxyUrl, {
            username: settings.nextcloudUsername,
            password: settings.nextcloudPassword,
            headers: {
                'x-target-url': targetUrl
            }
        });
    },

    async pushToNextcloud(settings: AppSettings): Promise<void> {
        let step = 'başlatılıyor';
        try {
            const client = await this.getWebDAVClient(settings);

            step = 'klasör kontrolü';
            const exists = await client.exists(BACKUP_DIR);

            if (!exists) {
                step = 'klasör oluşturma';
                await client.createDirectory(BACKUP_DIR);
            }

            step = 'veri hazırlama';
            const items = await db.items.toArray();
            const data = JSON.stringify(items, null, 2);

            step = 'dosya yükleme';
            await client.putFileContents(BACKUP_FILENAME, data);

            await db.settings.update(1, { lastSync: Date.now() });
        } catch (e: any) {
            console.error(`Detailed Sync error at step "${step}":`, {
                status: e.status,
                statusText: e.statusText,
                message: e.message,
                response: e.response
            });
            if (e?.status === 500) {
                throw new Error(`Sunucu 500 hatası döndürdü (${step} aşamasında). Lütfen Nextcloud loglarını kontrol edin.`);
            }
            if (e.status === 405) {
                throw new Error(`405 Method Not Allowed (${step} aşamasında): URL hatalı olabilir veya bu işlem sunucu tarafından engelleniyor.`);
            }
            throw new Error(`${step} aşamasında hata oluştu: ${e.message}`);
        }
    },

    async pullFromNextcloud(settings: AppSettings): Promise<number> {
        const targetUrl = settings.nextcloudUrl || '';
        try {
            const client = await this.getWebDAVClient(settings);

            if (!(await client.exists(BACKUP_FILENAME))) {
                throw new Error('No backup found on Nextcloud');
            }

            const data = await client.getFileContents(BACKUP_FILENAME, { format: 'text' });
            const items: TrackableItem[] = JSON.parse(data as string);

            if (!Array.isArray(items)) throw new Error('Invalid data on server');

            await db.transaction('rw', db.items, async () => {
                await db.items.clear();
                await db.items.bulkAdd(items);
            });

            await db.settings.update(1, { lastSync: Date.now() });
            return items.length;
        } catch (e: any) {
            if (e.status === 405) {
                throw new Error(`405 Method Not Allowed: Hesabınız bu işleme izin vermiyor veya URL hatalı. Hedef URL: ${targetUrl}`);
            }
            throw e;
        }
    },

    async testConnection(settings: AppSettings): Promise<boolean> {
        const targetUrl = settings.nextcloudUrl || '';
        try {
            const client = await this.getWebDAVClient(settings);
            // List root to test connection
            await client.getDirectoryContents('/');
            return true;
        } catch (e: any) {
            if (e.status === 405) {
                throw new Error(`405 Method Not Allowed: WebDAV bağlantısı reddedildi. Lütfen girdiğiniz URL'nin (remote.php/dav/files/kullanici/) doğru olduğundan emin olun. Hedef: ${targetUrl}`);
            }
            throw e;
        }
    }
};
