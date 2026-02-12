import Dexie, { type EntityTable } from 'dexie';
import type { TrackableItem, AppSettings } from '@/types';

const DB_NAME = 'NextTrackerDB';

export const db = new Dexie(DB_NAME) as Dexie & {
    items: EntityTable<TrackableItem, 'id'>;
    books: EntityTable<TrackableItem, 'id'>; // Books use the same base TrackableItem structure for consistency
    settings: EntityTable<AppSettings, 'id'>;
};

db.version(3).stores({
    items: 'id, type, status, title, externalId, updatedAt',
    books: 'id, status, title, externalId, updatedAt',
    settings: '++id'
});

db.version(2).stores({
    items: 'id, type, status, title, externalId, updatedAt',
    settings: '++id'
}).upgrade(() => {
    // Optional migration
});

db.version(1).stores({
    items: 'id, type, status, title, externalId',
    settings: '++id'
});

export async function getSettings() {
    const settings = await db.settings.get(1);
    return settings || {};
}

export async function saveSettings(settings: Partial<AppSettings>) {
    // Always update ID 1
    const existing = await getSettings();
    await db.settings.put({ ...existing, ...settings, id: 1 });
}
