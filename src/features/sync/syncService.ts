import { db } from '@/db/db';
import type { TrackableItem } from '@/types';

export const syncService = {
    /**
     * Verileri JSON dosyası olarak dışa aktarır (Manuel Yedekleme)
     */
    async exportToJSON() {
        const items = await db.items.toArray();
        const data = JSON.stringify(items, null, 2);

        // Tarayıcı indirme işlemini tetikle
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexttracker-yedek-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        await db.settings.update(1, { lastSync: Date.now() });
        return items.length;
    },

    /**
     * Seçilen JSON yedek dosyasını veritabanına yükler (Geri Yükleme)
     */
    async importFromJSON(file: File): Promise<number> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const result = e.target?.result as string;
                    if (!result) throw new Error('Dosya boş.');

                    const items: TrackableItem[] = JSON.parse(result);
                    if (!Array.isArray(items)) throw new Error('Geçersiz yedek dosyası formatı.');

                    await db.transaction('rw', db.items, async () => {
                        await db.items.clear();
                        await db.items.bulkAdd(items);
                    });

                    await db.settings.update(1, { lastSync: Date.now() });
                    resolve(items.length);
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = () => reject(new Error('Dosya okunurken hata oluştu.'));
            reader.readAsText(file);
        });
    }
};
