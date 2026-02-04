import { createClient } from 'webdav';
import { getSettings } from '@/db/db';

async function getClient() {
    const settings = await getSettings();
    if (!settings.nextcloudUrl || !settings.nextcloudUsername || !settings.nextcloudPassword) {
        throw new Error('Nextcloud configuration missing');
    }

    return createClient(settings.nextcloudUrl, {
        username: settings.nextcloudUsername,
        password: settings.nextcloudPassword,
    });
}

const BACKUP_PATH = '/NextTracker/backup.json';

export const webdavClient = {
    async checkConnection(): Promise<true | string> {
        try {
            const client = await getClient();
            await client.getDirectoryContents('/');
            return true;
        } catch (error: any) {
            console.error('WebDAV Connection Error:', error);
            if (error.response?.status === 401) return 'Hata: Kullanıcı adı veya şifre yanlış (401).';
            if (error.response?.status === 404) return 'Hata: URL bulunamadı (404). URL\'yi kontrol edin.';
            if (error.message === 'Failed to fetch') return 'Hata: CORS engeli veya sunucuya ulaşılamıyor. (Tarayıcı Nextcloud\'a doğrudan erişemiyor olabilir).';
            return `Hata: ${error.message}`;
        }
    },

    async uploadBackup(data: string) {
        const client = await getClient();
        // Ensure directory exists
        if (await client.exists('/NextTracker') === false) {
            await client.createDirectory('/NextTracker');
        }
        await client.putFileContents(BACKUP_PATH, data, { overwrite: true });
    },

    async downloadBackup(): Promise<string> {
        const client = await getClient();
        if (await client.exists(BACKUP_PATH) === false) {
            throw new Error('No backup found');
        }
        const contents = await client.getFileContents(BACKUP_PATH, { format: 'text' });
        return contents as string;
    }
};
