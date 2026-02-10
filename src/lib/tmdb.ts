
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
    vote_count?: number;
    popularity?: number;
}

export interface TMDBDetail extends TMDBSearchResult {
    genres?: { id: number; name: string }[];
    runtime?: number;
    episode_run_time?: number[];
    number_of_seasons?: number;
    status?: string;
    homepage?: string;
    tagline?: string;
    budget?: number;
    revenue?: number;
    original_language?: string;
    original_title?: string;
    original_name?: string;
    production_companies?: { id: number; name: string; logo_path?: string }[];
    production_countries?: { iso_3166_1: string; name: string }[];
    spoken_languages?: { iso_639_1: string; english_name: string; name: string }[];
    belongs_to_collection?: { id: number; name: string; poster_path?: string; backdrop_path?: string };
    keywords?: {
        keywords?: { id: number; name: string }[];
        results?: { id: number; name: string }[]; // TV uses results key
    };
    recommendations?: {
        results: TMDBSearchResult[];
    };
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
            job: string;
            profile_path?: string;
        }>;
    };
    release_dates?: {
        results: Array<{
            iso_3166_1: string;
            release_dates: Array<{
                certification: string;
                release_date: string;
                type: number;
            }>;
        }>;
    };
    content_ratings?: {
        results: Array<{
            iso_3166_1: string;
            rating: string;
        }>;
    };
    external_ids?: {
        imdb_id?: string;
        facebook_id?: string;
        instagram_id?: string;
        twitter_id?: string;
        wikidata_id?: string;
    };
    watch_providers?: {
        results: Record<string, {
            flatrate?: Array<{ provider_id: number; provider_name: string; logo_path?: string }>;
            rent?: Array<{ provider_id: number; provider_name: string; logo_path?: string }>;
            buy?: Array<{ provider_id: number; provider_name: string; logo_path?: string }>;
            link?: string;
        }>;
    };
    images?: {
        backdrops?: Array<{ file_path: string }>;
        posters?: Array<{ file_path: string }>;
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
        // Fetch rich data in one request: credits (cast/crew), videos (trailers),
        // recommendations (similar movies), keywords, release info, providers and images
        const detail = await fetchTMDB(`/${type}/${id}`, {
            append_to_response: 'videos,credits,recommendations,keywords,release_dates,content_ratings,external_ids,watch/providers,images'
        });

        const watchProviders = (detail as any)['watch/providers'];
        if (watchProviders) {
            (detail as any).watch_providers = watchProviders;
            delete (detail as any)['watch/providers'];
        }

        return { ...detail, media_type: type } as TMDBDetail;
    },

    getImageUrl(path: string, size: 'w500' | 'original' | 'w780' | 'w300' = 'w500') {
        if (!path) return '';
        const baseUrl = size === 'original'
            ? 'https://image.tmdb.org/t/p/original'
            : `https://image.tmdb.org/t/p/${size}`;
        return `${baseUrl}${path}`;
    }
};
