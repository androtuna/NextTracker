import { db } from '@/db/db';
import type { TrackableItem, ItemType, ItemStatus } from '@/types';

export const trackingRepository = {
    async getAllItems() {
        return db.items.orderBy('updatedAt').reverse().toArray();
    },

    async getItemsByStatus(status: ItemStatus) {
        return db.items.where('status').equals(status).sortBy('updatedAt');
    },

    async getItemsByType(type: ItemType) {
        return db.items.where('type').equals(type).sortBy('updatedAt');
    },

    async addItem(item: Omit<TrackableItem, 'id' | 'createdAt' | 'updatedAt'>) {
        const newItem: TrackableItem = {
            ...item,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await db.items.add(newItem);
        return newItem;
    },

    async updateItem(id: string, updates: Partial<TrackableItem>) {
        const updated = {
            ...updates,
            updatedAt: Date.now()
        };
        await db.items.update(id, updated);
    },

    async deleteItem(id: string) {
        await db.items.delete(id);
    },

    async getItemByExternalId(externalId: string) {
        return db.items.where('externalId').equals(externalId).first();
    }
};
