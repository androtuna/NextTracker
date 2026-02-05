import { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Check, Info } from 'lucide-react';
import { tmdbClient, type TMDBSearchResult, type TMDBDetail } from '@/lib/tmdb';
import { mapTmdbToItem } from '@/features/search/utils';
import { trackingRepository } from '@/features/tracking/repository';
import { cn } from '@/lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from '@/lib/i18n';
import { HeroSection } from '@/components/HeroSection';
import { ContentRow } from '@/components/ContentRow';
import { DetailModal } from '@/components/DetailModal';

export default function SearchPage() {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<TMDBSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Discovery Data
    const [trending, setTrending] = useState<TMDBSearchResult[]>([]);
    const [popularMovies, setPopularMovies] = useState<TMDBSearchResult[]>([]);
    const [popularTV, setPopularTV] = useState<TMDBSearchResult[]>([]);
    const [topRated, setTopRated] = useState<TMDBSearchResult[]>([]);
    const [selected, setSelected] = useState<TMDBDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        // Fetch discovery data on mount
        const fetchDiscovery = async () => {
            try {
                const [trend, popM, popTV, top] = await Promise.all([
                    tmdbClient.getTrending('week'),
                    tmdbClient.getPopular('movie'),
                    tmdbClient.getPopular('tv'),
                    tmdbClient.getTopRated('movie')
                ]);
                setTrending(trend.results);
                setPopularMovies(popM.results);
                setPopularTV(popTV.results);
                setTopRated(top.results);
            } catch (err) {
                console.error("Failed to fetch discovery data:", err);
            }
        };
        fetchDiscovery();
    }, []);

    // Get existing items to show "Added" status
    const existingItems = useLiveQuery(() => trackingRepository.getAllItems());
    const existingIds = new Set(existingItems?.map(i => i.externalId));

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await tmdbClient.search(query);
            setResults(res.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv'));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (result: TMDBSearchResult) => {
        try {
            const item = mapTmdbToItem(result);
            await trackingRepository.addItem(item);
        } catch (err) {
            console.error(err);
        }
    };

    // Hero Item (First trending item)
    const heroItem = trending.length > 0 ? trending[0] : null;

    const openDetails = async (item: TMDBSearchResult) => {
        const guessedType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        if (guessedType === 'person') return;
        try {
            setDetailLoading(true);
            const detail = await tmdbClient.getDetails(guessedType as 'movie' | 'tv', item.id);
            setSelected(detail);
        } catch (err) {
            console.error('Detay getirilemedi', err);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div className="pb-20 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black min-h-screen">
            {/* Search Header - Sticky */}
            <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 p-4 md:p-6 transition-all">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <form onSubmit={handleSearch} className="relative group w-full max-w-2xl mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="size-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (!e.target.value.trim()) setResults([]);
                            }}
                            placeholder={t('searchPlaceholder')}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-3 rounded-full focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600 shadow-sm"
                        />
                        {loading && (
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                <Loader2 className="size-5 text-blue-500 animate-spin" />
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-6">
                {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
                {detailLoading && (
                    <div className="text-center text-sm text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-full inline-flex items-center gap-2 mx-auto">
                        <Loader2 className="size-4 animate-spin" /> Detaylar yükleniyor...
                    </div>
                )}

                {query.trim().length > 0 ? (
                    // Search Results
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {results.map(result => {
                            const isAdded = existingIds.has(result.id.toString());
                            const imageUrl = tmdbClient.getImageUrl(result.poster_path || '');

                            return (
                                <div
                                    key={result.id}
                                    className="relative group bg-zinc-900 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                                >
                                    <div className="aspect-[2/3] bg-zinc-800 relative">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={result.title || result.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onClick={() => openDetails(result)}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-700">{t('noImage')}</div>
                                        )}

                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 text-center">
                                            <p className="text-white font-medium line-clamp-2">{result.title || result.name}</p>
                                            <p className="text-xs text-gray-400">{result.release_date?.slice(0, 4) || result.first_air_date?.slice(0, 4)}</p>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDetails(result);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/15 text-white border border-white/10 hover:bg-white/25 transition-colors text-sm"
                                                >
                                                    <Info className="size-4" /> Detay
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isAdded) handleAdd(result);
                                                    }}
                                                    disabled={isAdded}
                                                    className={cn(
                                                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                                                        isAdded
                                                            ? "bg-green-500/20 text-green-400 cursor-default"
                                                            : "bg-white text-black hover:bg-gray-200"
                                                    )}
                                                >
                                                    {isAdded ? <><Check className="size-4" /> {t('added')}</> : <><Plus className="size-4" /> {t('add')}</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {results.length === 0 && !loading && (
                            <div className="col-span-full text-center text-gray-500 py-20">
                                Sonuç bulunamadı.
                            </div>
                        )}
                    </div>
                ) : (
                    // Discovery / Home UI
                    <div className="animate-in fade-in duration-700">
                        {heroItem && <HeroSection item={heroItem} onDetails={openDetails} />}

                        <div className="-mt-12 md:-mt-20 relative z-20 space-y-10 pl-1 md:pl-4 pb-6">
                            <ContentRow title="Haftanın Trendleri" items={trending.slice(1)} onSelect={openDetails} />
                            <ContentRow title="Popüler Filmler" items={popularMovies} onSelect={openDetails} />
                            <ContentRow title="Popüler Diziler" items={popularTV} onSelect={openDetails} />
                            <ContentRow title="IMDB Top 250 (Filmler)" items={topRated} onSelect={openDetails} />
                        </div>
                    </div>
                )}
            </div>

            <DetailModal item={selected} open={!!selected && !detailLoading} onClose={() => setSelected(null)} />
        </div>
    );
}
