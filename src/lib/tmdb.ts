

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

export interface TMDBDetail extends TMDBSearchResult {
    genres?: { id: number; name: string }[];
    runtime?: number;
    episode_run_time?: number[];
    number_of_seasons?: number;
    status?: string;
    homepage?: string;
    tagline?: string;
    videos?: {
        results: Array<{
            key: string;
            name: string;
            site: string;
            type: string;
            official?: boolean;
        }>;
    };
    credits?: {
        cast: Array<{
            id: number;
            name: string;
            character?: string;
            profile_path?: string;
        }>;
        crew: Array<{
            id: number;
            name: string;
            job?: string;
        }>;
    };
}

export interface TMDBSearchResponse {
    page: number;
    results: TMDBSearchResult[];
    total_pages: number;
    total_results: number;
}

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // We use a relative path to the local proxy which securely handles the API Key
    const url = new URL(`/api/tmdb${cleanEndpoint}`, window.location.origin);

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    const res = await fetch(url.toString());
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `TMDB Error (${res.status}): ${res.statusText}`);
    }
    return res.json();
}

export const tmdbClient = {
    async search(query: string): Promise<TMDBSearchResponse> {
        return fetchTMDB('/search/multi', { query });
    },

    async getTrending(timeWindow: 'day' | 'week' = 'week'): Promise<TMDBSearchResponse> {
        return fetchTMDB(`/trending/all/${timeWindow}`);
    },

    async getPopular(type: 'movie' | 'tv'): Promise<TMDBSearchResponse> {
        return fetchTMDB(`/${type}/popular`);
    },

    async getTopRated(type: 'movie' | 'tv'): Promise<TMDBSearchResponse> {
        return fetchTMDB(`/${type}/top_rated`);
    },

    async getDetails(type: 'movie' | 'tv', id: number): Promise<TMDBDetail> {
        // Append videos and credits for richer detail view
        const detail = await fetchTMDB(`/${type}/${id}`, { append_to_response: 'videos,credits' });
        return { ...detail, media_type: type } as TMDBDetail;
    },

    getImageUrl(path: string, size: 'w500' | 'original' = 'w500') {
        if (!path) return '';
        const baseUrl = size === 'original' ? 'https://image.tmdb.org/t/p/original' : IMAGE_BASE_URL;
        return `${baseUrl}${path}`;
    }
};
