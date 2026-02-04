import type { TMDBSearchResult } from '@/lib/tmdb';
import { tmdbClient } from '@/lib/tmdb';
import type { TrackableItem, ItemType } from '@/types';

export function mapTmdbToItem(result: TMDBSearchResult): Omit<TrackableItem, 'id' | 'createdAt' | 'updatedAt'> {
    const type: ItemType = result.media_type === 'tv' ? 'series' : 'movie';

    return {
        type,
        title: result.title || result.name || 'Unknown Title',
        externalId: result.id.toString(),
        image: tmdbClient.getImageUrl(result.poster_path || ''),
        status: 'planned', // Default status
        progress: 0,
        maxProgress: 0, // Need details to get runtime/episodes. For now 0.
        rating: 0,
        tags: [],
        metadata: {
            original_language: 'tr', // default assumption or fetch from result
            overview: result.overview,
            release_date: result.release_date || result.first_air_date,
            vote_average: result.vote_average
        }
    };
}
