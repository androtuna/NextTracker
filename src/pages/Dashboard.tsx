import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { trackingRepository } from '@/features/tracking/repository';
import { cn } from '@/lib/utils';
import { PlayCircle, CheckCircle, Clock, List } from 'lucide-react';
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
                    <h1 className="text-3xl font-bold text-white tracking-tight">{t('watchList')}</h1>
                    <p className="text-gray-400 mt-2">{t('watchListDesc')}</p>
                </div>

                <div className="flex p-1 bg-zinc-900 rounded-lg border border-zinc-800 self-start">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-zinc-800 text-white shadow-sm"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <tab.icon className="size-4" />
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredItems?.map(item => (
                    <div key={item.id} className="bg-zinc-900 rounded-xl overflow-hidden shadow-sm hover:ring-2 ring-blue-500/50 transition cursor-pointer group">
                        <div className="aspect-[2/3] relative bg-zinc-800">
                            {item.image ? (
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-700">{t('noImage')}</div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                                <select
                                    className="bg-black/50 text-white text-xs border border-white/20 rounded px-2 py-1 outline-none"
                                    value={item.status}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => trackingRepository.updateItem(item.id, { status: e.target.value as ItemStatus })}
                                >
                                    <option value="planned">{t('planned')}</option>
                                    <option value="in-progress">{t('watching')}</option>
                                    <option value="completed">{t('completed')}</option>
                                    <option value="dropped">{t('dropped')}</option>
                                </select>
                                <div className="mt-2 text-white font-medium text-sm">{t('details')}</div>
                            </div>
                        </div>
                        <div className="p-3">
                            <h3 className="font-medium text-white truncate" title={item.title}>{item.title}</h3>
                            <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                                {item.type === 'movie' ? t('movie') : t('series')}
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
