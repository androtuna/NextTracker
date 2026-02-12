import { useState, useEffect } from 'react';
import { Search, BookOpen, Loader2, Plus, Check, Info } from 'lucide-react';
import { bookService } from '@/features/books/bookService';
import type { BookSearchResult } from '@/types';
import { db } from '@/db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { cn } from '@/lib/utils';
import BookDetailModal from '@/components/BookDetailModal';
import { useTranslation } from '@/lib/i18n';

export default function BooksPage() {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<BookSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        const data = await bookService.searchBooks(query);
        setResults(data);
        setLoading(false);
    };

    // Initial popular search
    useEffect(() => {
        const fetchInitial = async () => {
            setLoading(true);
            const data = await bookService.searchBooks('best sellers');
            setResults(data);
            setLoading(false);
        };
        fetchInitial();
    }, []);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight flex items-center gap-3">
                        <BookOpen className="size-10 text-indigo-500" />
                        {t('books')}
                    </h1>
                    <p className="text-[var(--muted-foreground)] mt-2 text-lg">Yeni dünyalar keşfedin ve okuma listenizi yönetin.</p>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[var(--muted-foreground)] group-focus-within:text-indigo-400 transition-colors" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Kitap veya yazar ara..."
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl pl-12 pr-4 py-4 text-[var(--foreground)] outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-lg"
                    />
                </form>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="size-12 text-indigo-500 animate-spin" />
                    <p className="text-[var(--muted-foreground)] font-medium">Kitaplar yükleniyor...</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {results.map((book) => (
                        <BookCard
                            key={book.id}
                            book={book}
                            onClick={() => {
                                setSelectedBook(book);
                                setModalOpen(true);
                            }}
                        />
                    ))}
                </div>
            )}

            {selectedBook && (
                <BookDetailModal
                    book={selectedBook}
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}

function BookCard({ book, onClick }: { book: BookSearchResult, onClick: () => void }) {
    const existing = useLiveQuery(
        () => db.books.where({ externalId: book.id }).first(),
        [book.id]
    );

    const handleAdd = async (e: React.MouseEvent) => {
        e.stopPropagation();
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
        <div
            onClick={onClick}
            className="group relative flex flex-col cursor-pointer transition-all duration-300"
        >
            <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--border)] shadow-md group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-300 relative">
                {book.thumbnail ? (
                    <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] bg-[var(--accent)]/10">
                        <BookOpen className="size-10 opacity-20" />
                    </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                        onClick={handleAdd}
                        className={cn(
                            "size-10 rounded-full flex items-center justify-center transition-all",
                            existing ? "bg-green-500 text-white" : "bg-white text-black hover:scale-110"
                        )}
                    >
                        {existing ? <Check className="size-6" /> : <Plus className="size-6" />}
                    </button>
                    <div className="size-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/40 transition-all">
                        <Info className="size-6" />
                    </div>
                </div>
            </div>

            <div className="mt-4 space-y-1">
                <h3 className="font-bold text-[var(--foreground)] text-sm line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors">
                    {book.title}
                </h3>
                <p className="text-[var(--muted-foreground)] text-xs truncate">
                    {book.authors.join(', ')}
                </p>
            </div>
        </div>
    );
}
