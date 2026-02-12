import { db } from '@/db/db';
import type { TrackableItem, ItemType, ItemStatus } from '@/types';

export const trackingRepository = {
    async getAllItems() {
        const [items, books] = await Promise.all([
            db.items.toArray(),
            db.books.toArray()
        ]);
        return [...items, ...books].sort((a, b) => b.updatedAt - a.updatedAt);
    },

    async getItemsByStatus(status: ItemStatus) {
        const [items, books] = await Promise.all([
            db.items.where('status').equals(status).toArray(),
            db.books.where('status').equals(status).toArray()
        ]);
        return [...items, ...books].sort((a, b) => b.updatedAt - a.updatedAt);
    },

    async addItem(item: Omit<TrackableItem, 'id' | 'createdAt' | 'updatedAt'>) {
        const newItem: TrackableItem = {
            ...item,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        if (item.type === 'book') {
            await db.books.add(newItem);
        } else {
            await db.items.add(newItem);
        }
        return newItem;
    },

    async updateItem(id: string, updates: Partial<TrackableItem>, type?: ItemType) {
        const updated = {
            ...updates,
            updatedAt: Date.now()
        };

        // If type is known, use specific table, otherwise try both
        if (type === 'book') {
            await db.books.update(id, updated);
        } else if (type === 'movie' || type === 'series') {
            await db.items.update(id, updated);
        } else {
            // Try items first, then books
            const inItems = await db.items.get(id);
            if (inItems) {
                await db.items.update(id, updated);
            } else {
                await db.books.update(id, updated);
            }
        }
    },

    async deleteItem(id: string) {
        await Promise.all([
            db.items.delete(id),
            db.books.delete(id)
        ]);
    },

    async getItemByExternalId(externalId: string) {
        const [item, book] = await Promise.all([
            db.items.where('externalId').equals(externalId).first(),
            db.books.where('externalId').equals(externalId).first()
        ]);
        return item || book;
    }
};
