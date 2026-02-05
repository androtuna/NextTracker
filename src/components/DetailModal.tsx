import { useEffect } from 'react';
import { X, Play, Clock, Users, Check, Plus } from 'lucide-react';
import { tmdbClient, type TMDBDetail } from '@/lib/tmdb';
import { mapTmdbToItem } from '@/features/search/utils';
import { trackingRepository } from '@/features/tracking/repository';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { cn } from '@/lib/utils';

interface DetailModalProps {
    item: TMDBDetail | null;
    open: boolean;
    onClose: () => void;
}

// Lightweight detail modal (no portal needed for this app shell)
export function DetailModal({ item, open, onClose }: DetailModalProps) {
    // Prevent background scroll when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [open]);

    if (!open || !item) return null;

    const backdrop = tmdbClient.getImageUrl(item.backdrop_path || item.poster_path || '', 'original');
    const poster = tmdbClient.getImageUrl(item.poster_path || '');
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date)?.slice(0, 4);
    const runtime = item.runtime || item.episode_run_time?.[0];
    const genres = item.genres?.map(g => g.name).join(' • ');
    const trailer = item.videos?.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');

    // Library check
    const existing = useLiveQuery(
        () => db.items.where({ externalId: item.id.toString() }).first(),
        [item.id]
    );

    const handleAdd = async () => {
        if (existing) return;
        const newItem = mapTmdbToItem(item);
        await trackingRepository.addItem(newItem);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-3 md:px-6">
            <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl">
                {/* Cover */}
                <div className="relative h-60 md:h-72 w-full">
                    {backdrop && (
                        <img src={backdrop} className="absolute inset-0 w-full h-full object-cover" alt={title} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-zinc-950" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 size-10 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-black/80 transition"
                        aria-label="Kapat"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-6 p-6 md:p-8">
                    {/* Poster */}
                    <div className="mx-auto md:mx-0 -mt-24 md:-mt-28 w-40 md:w-52 relative">
                        <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-xl bg-zinc-900">
                            {poster ? (
                                <img src={poster} alt={title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
                            )}
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleAdd}
                                disabled={!!existing}
                                className={cn(
                                    "flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition",
                                    existing
                                        ? "bg-green-600/20 text-green-300 border border-green-600/30 cursor-default"
                                        : "bg-white text-black hover:bg-gray-200"
                                )}
                            >
                                {existing ? <Check className="size-4" /> : <Plus className="size-4" />}
                                {existing ? 'Listende' : 'Listeye Ekle'}
                            </button>
                            {trailer && (
                                <a
                                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-white hover:bg-white/10 transition"
                                >
                                    <Play className="size-4" /> Fragman
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Text */}
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-blue-300 uppercase tracking-wide">
                            {item.media_type === 'tv' ? 'Dizi' : 'Film'}
                            {year && <span className="text-gray-400">• {year}</span>}
                            {item.vote_average ? <span className="text-yellow-400">★ {item.vote_average.toFixed(1)}</span> : null}
                            {runtime ? (
                                <span className="inline-flex items-center gap-1 text-gray-300">
                                    <Clock className="size-4" /> {runtime} dk
                                </span>
                            ) : null}
                        </div>

                        <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
                        {item.tagline && <p className="text-gray-300 italic">“{item.tagline}”</p>}
                        {genres && <p className="text-sm text-gray-400">{genres}</p>}
                        <p className="text-gray-200 leading-relaxed">{item.overview}</p>

                        {item.credits?.cast?.length ? (
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
                                <Users className="size-4 text-gray-400" />
                                {item.credits.cast.slice(0, 6).map(c => (
                                    <span key={c.id} className="px-2 py-1 bg-white/5 rounded-full border border-white/5">
                                        {c.name}{c.character ? ` (${c.character})` : ''}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
