
import { getSettings } from '@/db/db';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface TMDBSearchResult {
    id: number;
    media_type: 'movie' | 'tv' | 'person';
    title?: string; // movie
    name?: string; // tv
    poster_path?: string;
    backdrop_path?: string;
    overview: string;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
}

export interface TMDBSearchResponse {
    page: number;
    results: TMDBSearchResult[];
    total_pages: number;
    total_results: number;
}

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
    const settings = await getSettings();
    if (!settings.tmdbApiKey) {
        throw new Error('TMDB API Key is missing');
    }

    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', settings.tmdbApiKey);
    url.searchParams.append('language', 'tr-TR'); // Default to Turkish as per request context

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error(`TMDB Error: ${res.statusText}`);
    }
    return res.json();
}

export const tmdbClient = {
    async search(query: string): Promise<TMDBSearchResponse> {
        return fetchTMDB('/search/multi', { query });
    },

    getImageUrl(path: string) {
        if (!path) return '';
        return `${IMAGE_BASE_URL}${path}`;
    }
};
