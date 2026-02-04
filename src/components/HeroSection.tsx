import { type TMDBSearchResult, tmdbClient } from '@/lib/tmdb';
import { Plus, Info, Check } from 'lucide-react';
import { db } from '@/db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { trackingRepository } from '@/features/tracking/repository';
import { mapTmdbToItem } from '@/features/search/utils';

interface HeroSectionProps {
    item: TMDBSearchResult;
}

export function HeroSection({ item }: HeroSectionProps) {
    const { t } = useTranslation();
    const backdropUrl = tmdbClient.getImageUrl(item.backdrop_path || item.poster_path || '', 'original');
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : '';

    // Check if item is already in library
    const existingItem = useLiveQuery(
        () => db.items.where({ externalId: item.id.toString() }).first(),
        [item.id]
    );

    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        setIsAdding(true);
        try {
            const newItem = mapTmdbToItem(item);
            await trackingRepository.addItem(newItem);
        } catch (error) {
            console.error('Failed to add item:', error);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden rounded-2xl mb-12 group">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${backdropUrl})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/30 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3 lg:w-1/2 flex flex-col gap-4 z-10">
                <div className="flex items-center gap-3 text-sm font-medium text-blue-400">
                    <span className="bg-blue-600/20 px-2 py-1 rounded border border-blue-600/30">
                        #{item.media_type === 'tv' ? t('series') || 'Series' : t('movie') || 'Movie'}
                    </span>
                    {year && <span className="text-zinc-300">{year}</span>}
                    <span className="flex items-center gap-1 text-yellow-500">
                        ★ {item.vote_average.toFixed(1)}
                    </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-xl">
                    {title}
                </h1>

                <p className="text-zinc-300 text-lg line-clamp-3 md:line-clamp-4 drop-shadow-md">
                    {item.overview}
                </p>

                <div className="flex items-center gap-4 mt-4">
                    {existingItem ? (
                        <button disabled className="flex items-center gap-2 px-6 py-3 bg-green-600/20 text-green-400 rounded-lg font-medium border border-green-600/20 cursor-default">
                            <Check className="size-5" /> {t('inList') || 'Listende'}
                        </button>
                    ) : (
                        <button
                            onClick={handleAdd}
                            disabled={isAdding}
                            className="flex items-center gap-2 px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-lg font-bold transition-all active:scale-95"
                        >
                            <Plus className="size-5" />
                            {t('addToList') || 'Listeme Ekle'}
                        </button>
                    )}

                    <button className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white hover:bg-white/20 rounded-lg font-medium backdrop-blur-sm transition-all border border-white/10">
                        <Info className="size-5" />
                        {t('details') || 'Detaylar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
