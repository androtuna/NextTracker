import { useEffect, useRef, useState } from 'react';
import {
    X,
    Play,
    Clock,
    Users,
    Check,
    Plus,
    Star,
    Globe,
    TrendingUp,
    DollarSign,
    Loader2,
    Calendar,
    Film,
    Languages,
    ShieldCheck,
    Link2,
    Sparkles,
    Building2,
    Flame,
    Video,
    BadgeInfo
} from 'lucide-react';
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

const REGION_PRIORITY = ['TR', 'US', 'GB'];

const formatCurrency = (val?: number) => val
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val)
    : '-';

const formatDate = (date?: string) => {
    if (!date) return '-';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
};

const formatRuntime = (minutes?: number) => {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h} sa ${m} dk` : `${m} dk`;
};

const pickCertification = (item: TMDBDetail) => {
    if (item.release_dates?.results?.length) {
        for (const region of REGION_PRIORITY) {
            const regionEntry = item.release_dates.results.find(r => r.iso_3166_1 === region);
            const cert = regionEntry?.release_dates?.find(r => r.certification)?.certification;
            if (cert) return cert;
        }
    }
    if (item.content_ratings?.results?.length) {
        for (const region of REGION_PRIORITY) {
            const regionEntry = item.content_ratings.results.find(r => r.iso_3166_1 === region);
            if (regionEntry?.rating) return regionEntry.rating;
        }
    }
    return '-';
};

const pickProviders = (item: TMDBDetail) => {
    if (!item.watch_providers?.results) return null;
    const region = REGION_PRIORITY.find(code => item.watch_providers?.results?.[code]);
    if (!region) return null;
    return item.watch_providers.results[region];
};

export function DetailModal({ item: initialItem, open, onClose }: DetailModalProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [fullDetail, setFullDetail] = useState<TMDBDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && initialItem) {
            document.body.style.overflow = 'hidden';
            window.history.pushState({ modal: true }, '');

            if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;

            const mediaType = initialItem.media_type || (initialItem.release_date ? 'movie' : 'tv');

            const fetchFull = async () => {
                setLoading(true);
                try {
                    const data = await tmdbClient.getDetails(mediaType as any, initialItem.id);
                    setFullDetail(data);
                } catch (e) {
                    console.error('Failed to fetch details:', e);
                    setFullDetail({ ...initialItem, media_type: mediaType } as any);
                } finally {
                    setLoading(false);
                }
            };
            fetchFull();
        } else {
            document.body.style.overflow = '';
            setFullDetail(null);
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
    }, [open, initialItem, onClose]);

    const existing = useLiveQuery(
        () => initialItem ? db.items.where({ externalId: initialItem.id.toString() }).first() : Promise.resolve(undefined),
        [initialItem?.id]
    );

    if (!open || !initialItem) return null;

    const item = fullDetail || initialItem;

    const backdrop = tmdbClient.getImageUrl(item.backdrop_path || '', 'original');
    const poster = tmdbClient.getImageUrl(item.poster_path || '', 'w500');
    const title = item.title || item.name || 'Bilinmeyen Başlık';
    const year = (item.release_date || item.first_air_date)?.slice(0, 4);
    const runtime = item.runtime || item.episode_run_time?.[0];
    const genres = item.genres?.map(g => g.name) || [];
    const trailer = item.videos?.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    const director = item.credits?.crew?.find(person => person.job === 'Director');
    const writers = item.credits?.crew?.filter(person => person.job === 'Screenplay' || person.job === 'Writer') || [];
    const cast = item.credits?.cast?.slice(0, 12) || [];
    const gallery = item.images?.backdrops?.slice(0, 8) || [];
    const certification = pickCertification(item);
    const providers = pickProviders(item);
    const imdbLink = item.external_ids?.imdb_id ? `https://www.imdb.com/title/${item.external_ids.imdb_id}` : '';

    const keywords = (item.keywords?.keywords || item.keywords?.results || []).slice(0, 14);

    const handleAdd = async () => {
        if (existing) return;
        await trackingRepository.addItem(mapTmdbToItem(item));
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl overflow-y-auto"
            ref={scrollContainerRef}
        >
            <div className="min-h-full w-full flex items-start justify-center p-4 md:p-8 lg:p-12">
                <div className="relative w-full max-w-6xl rounded-[28px] bg-[#0b0f1a] border border-white/5 shadow-[0_20px_120px_rgba(0,0,0,0.65)] animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-40 -right-40 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.28),transparent_60%)]" />
                        <div className="absolute -bottom-40 -left-40 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.18),transparent_60%)]" />
                    </div>

                    {/* Hero */}
                    <div className="relative w-full">
                        <div className="relative h-[340px] md:h-[480px] w-full">
                            {backdrop ? (
                                <img src={backdrop} className="absolute inset-0 w-full h-full object-cover" alt={title} />
                            ) : (
                                <div className="absolute inset-0 bg-slate-800" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-[#0b0f1a]/70 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f1a]/80 via-transparent to-[#0b0f1a]/40" />

                            {loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-50 transition-opacity">
                                    <Loader2 className="size-10 text-indigo-400 animate-spin mb-4" />
                                    <span className="text-white font-medium tracking-wide">Detaylar yükleniyor...</span>
                                </div>
                            )}

                            <button
                                onClick={() => window.history.back()}
                                className="absolute top-6 right-6 size-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black hover:scale-110 transition-all z-[60]"
                            >
                                <X className="size-6" />
                            </button>

                            <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col lg:flex-row gap-8 items-end">
                                <div className="hidden md:block w-48 lg:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.55)] border border-white/10 -mb-20 z-10">
                                    <img src={poster} alt={title} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-semibold text-white/80 uppercase">
                                        <span className="px-2.5 py-1 bg-indigo-500/90 rounded-lg text-[11px]">{(item.media_type || 'Film').toUpperCase()}</span>
                                        {year && <span className="text-white/70">{year}</span>}
                                        {runtime && <span className="text-white/70">{formatRuntime(runtime)}</span>}
                                        <span className="inline-flex items-center gap-1 text-white/70"><ShieldCheck className="size-4" /> {certification}</span>
                                        {item.status && <span className="text-white/50">• {item.status}</span>}
                                    </div>

                                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                                        {title}
                                    </h2>

                                    {item.tagline && (
                                        <p className="text-indigo-200/80 text-sm md:text-base italic">“{item.tagline}”</p>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {genres.map(g => (
                                            <span key={g} className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 text-xs text-slate-200">
                                                {g}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 pt-2">
                                        <button
                                            onClick={handleAdd}
                                            disabled={!!existing}
                                            className={cn(
                                                "h-11 px-6 rounded-xl font-bold transition-all flex items-center gap-2",
                                                existing
                                                    ? "bg-slate-800 text-slate-400 border border-white/5"
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
                                                className="h-11 px-6 rounded-xl font-bold bg-slate-800/80 backdrop-blur-md border border-white/10 text-white flex items-center gap-2 hover:bg-slate-700 transition"
                                            >
                                                <Play className="fill-current size-5" /> Fragmanı İzle
                                            </a>
                                        )}
                                        {item.homepage && (
                                            <a
                                                href={item.homepage}
                                                target="_blank" rel="noreferrer"
                                                className="h-11 px-4 rounded-xl font-semibold bg-transparent border border-white/10 text-white/80 flex items-center gap-2 hover:bg-white/5 transition"
                                            >
                                                <Link2 className="size-4" /> Site
                                            </a>
                                        )}
                                        {imdbLink && (
                                            <a
                                                href={imdbLink}
                                                target="_blank" rel="noreferrer"
                                                className="h-11 px-4 rounded-xl font-semibold bg-transparent border border-white/10 text-white/80 flex items-center gap-2 hover:bg-white/5 transition"
                                            >
                                                <Film className="size-4" /> IMDb
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="hidden lg:flex flex-col gap-4">
                                    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 w-[240px]">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
                                                <Star className="size-5 text-amber-400 fill-current" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-white/50">TMDB Puanı</p>
                                                <p className="text-2xl font-black text-white">{item.vote_average?.toFixed(1) || '0.0'}<span className="text-white/40 text-sm font-normal"> / 10</span></p>
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/70">
                                            <div className="rounded-lg bg-white/5 p-2">
                                                <p className="text-white/40">Oy</p>
                                                <p className="font-semibold">{item.vote_count?.toLocaleString('tr-TR') || '0'}</p>
                                            </div>
                                            <div className="rounded-lg bg-white/5 p-2">
                                                <p className="text-white/40">Popülerlik</p>
                                                <p className="font-semibold">{Math.round(item.popularity || 0)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {providers?.flatrate?.length ? (
                                        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 w-[240px]">
                                            <div className="flex items-center gap-2 text-xs text-white/50 uppercase tracking-wider">
                                                <Video className="size-4" /> İzleme
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {providers.flatrate.slice(0, 5).map(provider => (
                                                    <div key={provider.provider_id} className="size-10 rounded-lg overflow-hidden bg-white/10 border border-white/10">
                                                        {provider.logo_path ? (
                                                            <img
                                                                src={tmdbClient.getImageUrl(provider.logo_path, 'w300')}
                                                                alt={provider.provider_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-white/70">
                                                                {provider.provider_name.slice(0, 2)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-10 p-6 md:p-10 lg:p-12">
                        <div className="space-y-12">
                            <section>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="size-5 text-indigo-300" /> Özet
                                </h3>
                                <p className="text-slate-300 text-lg leading-relaxed mt-4 max-w-3xl">
                                    {item.overview || 'Bu içerik için bir özet bulunmuyor.'}
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10">
                                    {director && (
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase text-slate-500 font-bold tracking-widest">Yönetmen</p>
                                            <p className="text-slate-100 font-medium">{director.name}</p>
                                        </div>
                                    )}
                                    {writers[0] && (
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase text-slate-500 font-bold tracking-widest">Senaryo</p>
                                            <p className="text-slate-100 font-medium">{writers[0].name}</p>
                                        </div>
                                    )}
                                    {item.production_companies?.[0] && (
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase text-slate-500 font-bold tracking-widest">Yapımcı</p>
                                            <p className="text-slate-100 font-medium">{item.production_companies[0].name}</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {cast.length ? (
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Users className="size-5 text-slate-400" /> Oyuncular
                                        </h3>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar -mx-2 px-2">
                                        {cast.map(person => (
                                            <div key={person.id} className="w-24 md:w-32 shrink-0 space-y-3 group">
                                                <div className="aspect-square rounded-full md:rounded-2xl overflow-hidden bg-slate-800 border-2 border-transparent group-hover:border-indigo-400 transition-all duration-300">
                                                    {person.profile_path ? (
                                                        <img
                                                            src={tmdbClient.getImageUrl(person.profile_path)}
                                                            alt={person.name}
                                                            className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-600"><Users className="size-8" /></div>
                                                    )}
                                                </div>
                                                <div className="text-center md:text-left">
                                                    <p className="text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-indigo-300 transition">{person.name}</p>
                                                    <p className="text-xs text-slate-500 line-clamp-1">{person.character}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ) : null}

                            {gallery.length ? (
                                <section>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
                                        <Flame className="size-5 text-rose-300" /> Sahne Kareleri
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {gallery.map((img, idx) => (
                                            <div key={`${img.file_path}-${idx}`} className="aspect-video rounded-xl overflow-hidden bg-slate-800 border border-white/5">
                                                <img
                                                    src={tmdbClient.getImageUrl(img.file_path, 'w780')}
                                                    alt={`${title} still ${idx + 1}`}
                                                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ) : null}

                            {item.recommendations?.results?.length ? (
                                <section>
                                    <h3 className="text-xl font-bold text-white mb-6">Önerilenler</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {item.recommendations.results.slice(0, 8).map(rec => (
                                            <div key={rec.id} className="aspect-[2/3] rounded-xl overflow-hidden bg-slate-800 border border-white/5 relative group cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition-all">
                                                <img
                                                    src={tmdbClient.getImageUrl(rec.poster_path || '', 'w500')}
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

                        <div className="space-y-8">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center">
                                        <BadgeInfo className="size-6 text-indigo-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hızlı Bilgiler</p>
                                        <p className="text-lg font-black text-white">Detay Kutusu</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar className="size-4" />
                                            <span>Yayın Tarihi</span>
                                        </div>
                                        <span className="text-white font-medium text-right">{formatDate(item.release_date || item.first_air_date)}</span>
                                    </div>

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock className="size-4" />
                                            <span>Süre</span>
                                        </div>
                                        <span className="text-white font-medium text-right">{formatRuntime(runtime)}</span>
                                    </div>

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Languages className="size-4" />
                                            <span>Orijinal Dil</span>
                                        </div>
                                        <span className="text-white font-medium text-right uppercase">{item.original_language || '-'}</span>
                                    </div>

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Globe className="size-4" />
                                            <span>Orijinal Başlık</span>
                                        </div>
                                        <span className="text-white font-medium text-right">{item.original_title || item.original_name || '-'}</span>
                                    </div>

                                    {item.number_of_seasons ? (
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Film className="size-4" />
                                                <span>Sezon</span>
                                            </div>
                                            <span className="text-white font-medium text-right">{item.number_of_seasons}</span>
                                        </div>
                                    ) : null}

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <TrendingUp className="size-4" />
                                            <span>Popülerlik</span>
                                        </div>
                                        <span className="text-white font-medium text-right">{Math.round(item.popularity || 0)}</span>
                                    </div>

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <DollarSign className="size-4" />
                                            <span>Bütçe</span>
                                        </div>
                                        <span className="text-white font-medium text-right">{formatCurrency(item.budget)}</span>
                                    </div>

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <DollarSign className="size-4" />
                                            <span>Hasılat</span>
                                        </div>
                                        <span className="text-white font-medium text-right">{formatCurrency(item.revenue)}</span>
                                    </div>
                                </div>
                            </div>

                            {providers?.flatrate?.length || providers?.rent?.length || providers?.buy?.length ? (
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider">
                                        <Video className="size-4" /> İzleme Seçenekleri
                                    </div>
                                    <div className="space-y-3">
                                        {providers.flatrate?.length ? (
                                            <div className="space-y-2">
                                                <p className="text-xs text-slate-500">Abonelik</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {providers.flatrate.slice(0, 6).map(p => (
                                                        <div key={p.provider_id} className="size-10 rounded-lg overflow-hidden bg-white/10 border border-white/10">
                                                            {p.logo_path ? (
                                                                <img src={tmdbClient.getImageUrl(p.logo_path, 'w300')} alt={p.provider_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-white/70">{p.provider_name.slice(0, 2)}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                        {providers.rent?.length ? (
                                            <div className="space-y-2">
                                                <p className="text-xs text-slate-500">Kiralama</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {providers.rent.slice(0, 6).map(p => (
                                                        <div key={p.provider_id} className="size-10 rounded-lg overflow-hidden bg-white/10 border border-white/10">
                                                            {p.logo_path ? (
                                                                <img src={tmdbClient.getImageUrl(p.logo_path, 'w300')} alt={p.provider_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-white/70">{p.provider_name.slice(0, 2)}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}

                            {item.belongs_to_collection ? (
                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider">Koleksiyon</p>
                                        <span className="text-[11px] text-indigo-300">Görüntüle</span>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <div className="size-16 rounded-xl overflow-hidden bg-white/10 border border-white/10">
                                            {item.belongs_to_collection.poster_path ? (
                                                <img
                                                    src={tmdbClient.getImageUrl(item.belongs_to_collection.poster_path, 'w300')}
                                                    alt={item.belongs_to_collection.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Building2 className="size-7 text-white/40 mx-auto mt-4" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold line-clamp-2">{item.belongs_to_collection.name}</p>
                                            <p className="text-xs text-slate-400">Koleksiyon sayfası</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {keywords.length ? (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Anahtar Kelimeler</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {keywords.map(kw => (
                                            <span key={kw.id} className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md text-[11px] text-slate-300 cursor-default transition">
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
