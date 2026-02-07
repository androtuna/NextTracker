import { db } from '@/db/db';
import type { TrackableItem, AppSettings } from '@/types';
import { createClient } from 'webdav';

const BACKUP_FILENAME = 'nexttracker_backup.json';

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

        // Normalize URL: Must end with /
        let targetUrl = settings.nextcloudUrl.trim();
        if (!targetUrl.endsWith('/')) {
            targetUrl += '/';
        }

        // Use local proxy to avoid CORS issues
        const proxyUrl = '/api/proxy';

        return createClient(proxyUrl, {
            username: settings.nextcloudUsername,
            password: settings.nextcloudPassword,
            headers: {
                'x-target-url': targetUrl
            }
        });
    },

    async pushToNextcloud(settings: AppSettings): Promise<void> {
        try {
            const client = await this.getWebDAVClient(settings);
            const items = await db.items.toArray();
            const data = JSON.stringify(items, null, 2);

            await client.putFileContents(BACKUP_FILENAME, data);

            await db.settings.update(1, { lastSync: Date.now() });
        } catch (e: any) {
            if (e.status === 405) {
                throw new Error('405 Method Not Allowed: WebDAV URL hatalı olabilir. Lütfen sonuna / eklediğinizden ve doğru Nextcloud WebDAV adresini girdiğinizden (remote.php/dav/...) emin olun.');
            }
            throw e;
        }
    },

    async pullFromNextcloud(settings: AppSettings): Promise<number> {
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
                throw new Error('405 Method Not Allowed: WebDAV URL hatalı olabilir.');
            }
            throw e;
        }
    },

    async testConnection(settings: AppSettings): Promise<boolean> {
        try {
            const client = await this.getWebDAVClient(settings);
            await client.getDirectoryContents('/');
            return true;
        } catch (e: any) {
            if (e.status === 405) {
                throw new Error('405 Method Not Allowed: WebDAV URL hatalı olabilir. Lütfen URL sonunun / ile bittiğini kontrol edin.');
            }
            throw e;
        }
    }
};
