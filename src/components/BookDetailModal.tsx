import { X, BookOpen, Calendar, Building2, User, Hash, Check, Plus, Star } from 'lucide-react';
import type { BookSearchResult } from '@/types';
import { db } from '@/db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { cn } from '@/lib/utils';

interface BookDetailModalProps {
    book: BookSearchResult;
    open: boolean;
    onClose: () => void;
}

export default function BookDetailModal({ book, open, onClose }: BookDetailModalProps) {
    const existing = useLiveQuery(
        () => db.books.where({ externalId: book.id }).first(),
        [book.id]
    );

    if (!open) return null;

    const handleAdd = async () => {
        if (existing) return;
        await db.books.add({
            id: crypto.randomUUID(),
            externalId: book.id,
            type: 'book',
            title: book.title,
            image: book.thumbnail,
            status: 'planned',
            progress: 0,
            maxProgress: book.pageCount || 0,
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            metadata: {
                authors: book.authors,
                publisher: book.publisher,
                publishedDate: book.publishedDate
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <div
                className="relative w-full max-w-4xl bg-[var(--card)] border border-[var(--border)] rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background Decoration */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 -right-24 size-64 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-blue-500/10 blur-3xl" />
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 size-12 rounded-full bg-[var(--background)]/50 backdrop-blur-md border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center hover:scale-110 transition-transform"
                >
                    <X className="size-6" />
                </button>

                <div className="relative flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto">
                    {/* Poster/Image Side */}
                    <div className="w-full md:w-80 shrink-0 bg-[var(--accent)]/5 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-[var(--border)]">
                        <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-[var(--border)]">
                            {book.thumbnail ? (
                                <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                                    <BookOpen className="size-16 opacity-10" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="flex-1 p-8 md:p-12 space-y-8">
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                                    KİTAP
                                </span>
                                {book.publishedDate && (
                                    <span className="text-[var(--muted-foreground)] text-sm font-medium flex items-center gap-1">
                                        <Calendar className="size-4" />
                                        {book.publishedDate.slice(0, 4)}
                                    </span>
                                )}
                            </div>

                            <h2 className="text-3xl md:text-4xl font-black text-[var(--foreground)] leading-tight">
                                {book.title}
                            </h2>

                            <div className="flex items-center gap-2 text-lg text-[var(--muted-foreground)]">
                                <User className="size-5 text-indigo-500" />
                                <span className="font-medium">{book.authors?.join(', ')}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 py-6 border-y border-[var(--border)]">
                            <InfoItem icon={Hash} label="Sayfa" value={book.pageCount || '-'} />
                            <InfoItem icon={Building2} label="Yayıncı" value={book.publisher || '-'} />
                            <InfoItem icon={Star} label="Durum" value={existing ? 'Listede' : 'Yeni'} />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-[var(--foreground)]">Açıklama</h3>
                            <div className="text-[var(--muted-foreground)] leading-relaxed text-sm md:text-base max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {book.description ? (
                                    <div dangerouslySetInnerHTML={{ __html: book.description }} />
                                ) : (
                                    'Bu kitap için bir açıklama bulunmuyor.'
                                )}
                            </div>
                        </div>

                        <div className="pt-6 flex flex-wrap gap-4">
                            <button
                                onClick={handleAdd}
                                disabled={!!existing}
                                className={cn(
                                    "px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95 shadow-lg",
                                    existing
                                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/25"
                                )}
                            >
                                {existing ? <Check className="size-6" /> : <Plus className="size-6" />}
                                {existing ? 'Listende' : 'Koleksiyona Ekle'}
                            </button>

                            <button className="px-8 py-4 rounded-2xl font-bold bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--accent)]/80 transition-all active:scale-95">
                                Paylaş
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted-foreground)] opacity-50 flex items-center gap-1">
                <Icon className="size-3" />
                {label}
            </p>
            <p className="text-[var(--foreground)] font-bold">{value}</p>
        </div>
    );
}
