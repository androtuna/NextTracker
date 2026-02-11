export type ItemType = 'movie' | 'series' | 'book' | 'fitness';
export type ItemStatus = 'planned' | 'in-progress' | 'completed' | 'dropped';

export interface TrackableItem {
    id: string; // UUID
    externalId?: string; // e.g., TMDB ID, ISBN
    type: ItemType;
    title: string;
    image?: string; // Poster path or URL
    status: ItemStatus;
    progress: number; // e.g., episode count, page number
    maxProgress?: number; // total episodes, total pages
    rating?: number; // User rating 0-10
    tags: string[];
    createdAt: number;
    updatedAt: number;
    // Flexible metadata for type-specific fields
    // Movies: director, releaseDate, runtime
    // Series: networks, nextEpisodeDate
    metadata: Record<string, any>;
}

export interface AppSettings {
    id?: number; // Singleton ID (usually 1)
    tmdbApiKey?: string;
    lastSync?: number;
    language?: 'tr' | 'en';
}
