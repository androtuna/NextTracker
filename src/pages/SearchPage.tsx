import { useState } from 'react';
import { Search, Loader2, Plus, Check } from 'lucide-react';
import { tmdbClient, type TMDBSearchResult } from '@/lib/tmdb';
import { mapTmdbToItem } from '@/features/search/utils';
import { trackingRepository } from '@/features/tracking/repository';
import { cn } from '@/lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<TMDBSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get existing items to show "Added" status
    const existingItems = useLiveQuery(() => trackingRepository.getAllItems());
    const existingIds = new Set(existingItems?.map(i => i.externalId));

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

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
            // No manual state update needed, existingItems query will refresh
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
            <div className="max-w-2xl">
                <h1 className="text-3xl font-bold text-white mb-6">Yeni İçerik Ekle</h1>
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="size-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Film veya dizi ara..."
                        className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600 shadow-sm"
                    />
                    {loading && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <Loader2 className="size-5 text-blue-500 animate-spin" />
                        </div>
                    )}
                </form>
                {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.map(result => {
                    const isAdded = existingIds.has(result.id.toString());
                    const imageUrl = tmdbClient.getImageUrl(result.poster_path || '');

                    return (
                        <div key={result.id} className="relative group bg-zinc-900 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                            <div className="aspect-[2/3] bg-zinc-800 relative">
                                {imageUrl ? (
                                    <img src={imageUrl} alt={result.title || result.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-700">Görsel Yok</div>
                                )}

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 text-center">
                                    <p className="text-white font-medium line-clamp-2">{result.title || result.name}</p>
                                    <p className="text-xs text-gray-400">{result.release_date?.slice(0, 4) || result.first_air_date?.slice(0, 4)}</p>

                                    <button
                                        onClick={() => !isAdded && handleAdd(result)}
                                        disabled={isAdded}
                                        className={cn(
                                            "mt-2 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                                            isAdded
                                                ? "bg-green-500/20 text-green-400 cursor-default"
                                                : "bg-white text-black hover:bg-gray-200"
                                        )}
                                    >
                                        {isAdded ? <><Check className="size-4" /> Eklendi</> : <><Plus className="size-4" /> Ekle</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
