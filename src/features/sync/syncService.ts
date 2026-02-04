import { db, saveSettings } from '@/db/db';
import { webdavClient } from './webdav';
import type { TrackableItem } from '@/types';

export const syncService = {
    async backup() {
        const items = await db.items.toArray();
        const backupData = JSON.stringify(items, null, 2); // Pretty print for debuggability
        await webdavClient.uploadBackup(backupData);
        await saveSettings({ lastSync: Date.now() });
        return items.length;
    },

    async restore() {
        const backupData = await webdavClient.downloadBackup();
        const items: TrackableItem[] = JSON.parse(backupData);

        // Transaction to ensure safety
        await db.transaction('rw', db.items, async () => {
            await db.items.clear();
            await db.items.bulkAdd(items);
        });

        await saveSettings({ lastSync: Date.now() });
        return items.length;
    }
};
