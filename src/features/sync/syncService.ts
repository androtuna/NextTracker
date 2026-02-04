import { db } from '@/db/db';
import type { TrackableItem } from '@/types';

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
    }
};
