import { type TMDBSearchResult, tmdbClient } from '@/lib/tmdb';
import { db } from '@/db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Check } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { trackingRepository } from '@/features/tracking/repository';
import { mapTmdbToItem } from '@/features/search/utils';

interface ContentRowProps {
    title: string;
    items: TMDBSearchResult[];
    onSelect?: (item: TMDBSearchResult) => void;
}

export function ContentRow({ title, items, onSelect }: ContentRowProps) {
    const [emblaRef] = useEmblaCarousel({
        loop: false,
        align: 'start',
        dragFree: true,
        containScroll: 'trimSnaps'
    });

    if (!items || items.length === 0) return null;

    return (
        <div className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 px-1">{title}</h2>

            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-4 touch-pan-y">
                    {items.map(item => (
                        <ContentCard key={item.id} item={item} onSelect={onSelect} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ContentCard({ item, onSelect }: { item: TMDBSearchResult; onSelect?: (item: TMDBSearchResult) => void }) {
    const posterUrl = tmdbClient.getImageUrl(item.poster_path || '');
    const title = item.title || item.name;

    // Check library status
    const existingItem = useLiveQuery(
        () => db.items.where({ externalId: item.id.toString() }).first(),
        [item.id]
    );

    const handleAdd = async () => {
        if (existingItem) return;
        try {
            const newItem = mapTmdbToItem(item);
            await trackingRepository.addItem(newItem);
        } catch (error) {
            console.error('Failed to add item:', error);
        }
    };

    return (
        <div
            className="flex-[0_0_160px] md:flex-[0_0_200px] relative group cursor-pointer"
            onClick={() => onSelect?.(item)}
        >
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-zinc-700">
                {posterUrl ? (
                    <img
                        src={posterUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        No Image
                    </div>
                )}

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {existingItem ? (
                        <div className="size-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center border border-green-500/50">
                            <Check className="size-6" />
                        </div>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAdd();
                            }}
                            className="size-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform"
                        >
                            <Plus className="size-6" />
                        </button>
                    )}
                </div>
            </div>

            <h3 className="mt-2 text-sm font-medium text-zinc-300 truncate group-hover:text-white transition-colors">
                {title}
            </h3>
        </div>
    );
}
