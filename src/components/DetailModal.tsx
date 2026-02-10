import { useEffect, useRef } from 'react';
import { X, Play, Clock, Users, Check, Plus, Star, Globe, TrendingUp, DollarSign } from 'lucide-react';
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

export function DetailModal({ item, open, onClose }: DetailModalProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            window.history.pushState({ modal: true }, '');
            if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
        } else {
            document.body.style.overflow = '';
        }

        const handlePopState = () => { if (open) onClose(); };
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) window.history.back(); };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    const existing = useLiveQuery(
        () => item ? db.items.where({ externalId: item.id.toString() }).first() : Promise.resolve(undefined),
        [item?.id]
    );

    if (!open || !item) return null;

    const backdrop = tmdbClient.getImageUrl(item.backdrop_path || '', 'original');
    const poster = tmdbClient.getImageUrl(item.poster_path || '');
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date)?.slice(0, 4);
    const runtime = item.runtime || item.episode_run_time?.[0];
    const genres = item.genres?.map(g => g.name);
    const trailer = item.videos?.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    const director = item.credits?.crew?.find(person => person.job === 'Director');
    const writer = item.credits?.crew?.find(person => person.job === 'Screenplay' || person.job === 'Writer');

    const formatCurrency = (val?: number) => val ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val) : '-';

    const handleAdd = async () => {
        if (existing) return;
        await trackingRepository.addItem(mapTmdbToItem(item));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md overflow-y-auto flex justify-center py-4 md:py-10" ref={scrollContainerRef}>
            <div className="w-full max-w-6xl px-4 flex flex-col items-center">
                <div className="relative w-full overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 shadow-2xl animate-in zoom-in-95 fade-in duration-300">

                    {/* Hero Header */}
                    <div className="relative aspect-[16/9] md:h-[450px] w-full">
                        {backdrop ? (
                            <img src={backdrop} className="absolute inset-0 w-full h-full object-cover" alt={title} />
                        ) : (
                            <div className="absolute inset-0 bg-zinc-800" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-black/30" />

                        <button
                            onClick={() => window.history.back()}
                            className="absolute top-6 right-6 size-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/80 transition z-20"
                        >
                            <X className="size-6" />
                        </button>

                        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 flex flex-col md:flex-row gap-8 items-end">
                            <div className="hidden md:block w-48 lg:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 -mb-20 z-10">
                                <img src={poster} alt={title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-medium text-white/80 uppercase">
                                    <span className="px-2 py-0.5 bg-blue-600 rounded text-xs">{(item.media_type || 'Film').toUpperCase()}</span>
                                    {year && <span>{year}</span>}
                                    {runtime && <span>{runtime} dk</span>}
                                    {item.status && <span className="text-zinc-400">• {item.status}</span>}
                                </div>
                                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                                    {title}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {genres?.map(g => (
                                        <span key={g} className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 text-xs text-zinc-300">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-4 pt-4">
                                    <button
                                        onClick={handleAdd}
                                        disabled={!!existing}
                                        className={cn(
                                            "h-12 px-8 rounded-xl font-bold transition-all flex items-center gap-2",
                                            existing
                                                ? "bg-zinc-800 text-zinc-400 border border-white/5"
                                                : "bg-white text-black hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
                                        )}
                                    >
                                        {existing ? <Check className="size-5" /> : <Plus className="size-5" />}
                                        {existing ? 'Listende' : 'Takibe Al'}
                                    </button>
                                    {trailer && (
                                        <a
                                            href={`https://www.youtube.com/watch?v=${trailer.key}`}
                                            target="_blank" rel="noreferrer"
                                            className="h-12 px-8 rounded-xl font-bold bg-zinc-800/80 backdrop-blur-md border border-white/10 text-white flex items-center gap-2 hover:bg-zinc-700 transition"
                                        >
                                            <Play className="fill-current size-5" /> Fragmanı İzle
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-12 p-6 md:p-12">
                        {/* Left Side: Overview and Cast */}
                        <div className="space-y-12">
                            <section>
                                <h3 className="text-xl font-bold text-white mb-4">Özet</h3>
                                <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl">
                                    {item.overview || 'Bu içerik için bir özet bulunmuyor.'}
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-10">
                                    {director && (
                                        <div className="space-y-1">
                                            <p className="text-xs uppercase text-zinc-500 font-bold tracking-widest">Yönetmen</p>
                                            <p className="text-zinc-200 font-medium">{director.name}</p>
                                        </div>
                                    )}
                                    {writer && (
                                        <div className="space-y-1">
                                            <p className="text-xs uppercase text-zinc-500 font-bold tracking-widest">Senaryo</p>
                                            <p className="text-zinc-200 font-medium">{writer.name}</p>
                                        </div>
                                    )}
                                    {item.production_companies?.[0] && (
                                        <div className="space-y-1">
                                            <p className="text-xs uppercase text-zinc-500 font-bold tracking-widest">Yapımcı</p>
                                            <p className="text-zinc-200 font-medium">{item.production_companies[0].name}</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Cast Section */}
                            {item.credits?.cast?.length ? (
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Users className="size-5 text-zinc-500" /> Oyuncular
                                        </h3>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar -mx-2 px-2">
                                        {item.credits.cast.slice(0, 12).map(person => (
                                            <div key={person.id} className="w-24 md:w-32 shrink-0 space-y-3 group">
                                                <div className="aspect-square rounded-full md:rounded-2xl overflow-hidden bg-zinc-800 border-2 border-transparent group-hover:border-blue-500 transition-all duration-300">
                                                    {person.profile_path ? (
                                                        <img
                                                            src={tmdbClient.getImageUrl(person.profile_path)}
                                                            alt={person.name}
                                                            className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-600"><Users className="size-8" /></div>
                                                    )}
                                                </div>
                                                <div className="text-center md:text-left">
                                                    <p className="text-sm font-bold text-zinc-100 line-clamp-1 group-hover:text-blue-400 transition">{person.name}</p>
                                                    <p className="text-xs text-zinc-500 line-clamp-1">{person.character}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ) : null}

                            {/* Recommendations Section */}
                            {item.recommendations?.results?.length ? (
                                <section>
                                    <h3 className="text-xl font-bold text-white mb-6">Önerilenler</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {item.recommendations.results.slice(0, 5).map(rec => (
                                            <div key={rec.id} className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 border border-white/5 relative group cursor-pointer shadow-lg hover:shadow-blue-500/10 transition-all">
                                                <img
                                                    src={tmdbClient.getImageUrl(rec.poster_path || '')}
                                                    alt={rec.title || rec.name}
                                                    className="w-full h-full object-cover group-hover:opacity-40 transition duration-300"
                                                />
                                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <p className="text-xs font-bold text-white line-clamp-2">{rec.title || rec.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ) : null}
                        </div>

                        {/* Right Side: Metadata Sidebar */}
                        <div className="space-y-10">
                            <div className="p-6 rounded-2xl bg-zinc-800/30 border border-white/5 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                        <Star className="size-6 text-orange-500 fill-current" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Puan</p>
                                        <p className="text-xl font-black text-white">{item.vote_average?.toFixed(1) || '0.0'}<span className="text-zinc-500 text-sm font-normal"> / 10</span></p>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4 border-t border-white/5 text-sm">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <TrendingUp className="size-4" />
                                            <span>Durum</span>
                                        </div>
                                        <span className="text-zinc-200 font-medium text-right">{item.status || '-'}</span>
                                    </div>

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <Globe className="size-4" />
                                            <span>Orijinal Başlık</span>
                                        </div>
                                        <span className="text-zinc-200 font-medium text-right">{item.original_title || item.original_name || '-'}</span>
                                    </div>

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <Clock className="size-4" />
                                            <span>Orijinal Dil</span>
                                        </div>
                                        <span className="text-zinc-200 font-medium text-right uppercase">{item.original_language || '-'}</span>
                                    </div>

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <DollarSign className="size-4" />
                                            <span>Bütçe</span>
                                        </div>
                                        <span className="text-zinc-200 font-medium text-right">{formatCurrency(item.budget)}</span>
                                    </div>

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <DollarSign className="size-4" />
                                            <span>Hasılat</span>
                                        </div>
                                        <span className="text-zinc-200 font-medium text-right">{formatCurrency(item.revenue)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Keywords / Tags */}
                            {(item.keywords?.keywords || item.keywords?.results)?.length ? (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-2">Anahtar Kelimeler</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(item.keywords?.keywords || item.keywords?.results)?.slice(0, 10).map(kw => (
                                            <span key={kw.id} className="px-3 py-1 bg-zinc-100/5 hover:bg-zinc-100/10 border border-white/5 rounded-md text-[11px] text-zinc-400 cursor-default transition">
                                                {kw.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
