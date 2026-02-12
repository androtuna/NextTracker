import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { trackingRepository } from '@/features/tracking/repository';
import { cn } from '@/lib/utils';
import { PlayCircle, CheckCircle, Clock, List, BookOpen, Info } from 'lucide-react';
import type { ItemStatus } from '@/types';
import { useTranslation } from '@/lib/i18n';

type Tab = 'all' | ItemStatus;

export default function Dashboard() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>('planned');
    const items = useLiveQuery(() => trackingRepository.getAllItems());

    const filteredItems = items?.filter(item => activeTab === 'all' || item.status === activeTab);

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: 'planned', label: t('planned'), icon: List },
        { id: 'in-progress', label: t('watching'), icon: PlayCircle },
        { id: 'completed', label: t('completed'), icon: CheckCircle },
        { id: 'all', label: t('all'), icon: Clock },
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">{t('watchList')}</h1>
                    <p className="text-[var(--muted-foreground)] mt-2">{t('watchListDesc')}</p>
                </div>

                <div className="flex p-1 bg-[var(--card)] rounded-lg border border-[var(--border)] self-start">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-[var(--accent)] text-[var(--foreground)] shadow-sm"
                                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            )}
                        >
                            <tab.icon className="size-4" />
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredItems?.map(item => (
                    <div key={item.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:ring-2 ring-indigo-500/50 transition-all cursor-pointer group flex flex-col">
                        <div className="aspect-[2/3] relative bg-[var(--accent)]/10 overflow-hidden">
                            {item.image ? (
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
                                    {item.type === 'book' ? <BookOpen className="size-12 opacity-20" /> : t('noImage')}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                                <select
                                    className="bg-black/50 text-white text-xs border border-white/20 rounded px-2 py-1 outline-none mb-2"
                                    value={item.status}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => trackingRepository.updateItem(item.id, { status: e.target.value as ItemStatus }, item.type)}
                                >
                                    <option value="planned">{t('planned')}</option>
                                    <option value="in-progress">{item.type === 'book' ? t('reading') : t('watching')}</option>
                                    <option value="completed">{t('completed')}</option>
                                    <option value="dropped">{t('dropped')}</option>
                                </select>
                                <div className="text-white font-medium text-sm flex items-center gap-1">
                                    <Info className="size-4" /> {t('details')}
                                </div>
                            </div>

                            {/* Progress Bar for Books */}
                            {item.type === 'book' && (item.maxProgress ?? 0) > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                                    <div
                                        className="h-full bg-indigo-500 transition-all"
                                        style={{ width: `${Math.min(100, (item.progress / (item.maxProgress ?? 1)) * 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col gap-1">
                            <h3 className="font-bold text-[var(--foreground)] text-sm line-clamp-1" title={item.title}>{item.title}</h3>
                            <p className="text-[var(--muted-foreground)] text-xs flex items-center gap-1">
                                {item.type === 'book' ? (
                                    <>
                                        <BookOpen className="size-3 text-indigo-400" />
                                        <span className="truncate">{item.metadata.authors?.[0] || 'Yazar'}</span>
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle className="size-3 text-blue-400" />
                                        {item.type === 'movie' ? t('movie') : t('series')}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                ))}
                {filteredItems?.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-500 border-2 border-dashed border-zinc-800 rounded-2xl">
                        {activeTab === 'all' ? t('emptyList') : t('emptyCategory')}
                    </div>
                )}
            </div>
        </div>
    );
}
