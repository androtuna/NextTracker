import type { BookSearchResult } from '@/types';

const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

export const bookService = {
    async searchBooks(query: string): Promise<BookSearchResult[]> {
        if (!query.trim()) return [];

        try {
            const response = await fetch(`${GOOGLE_BOOKS_BASE_URL}?q=${encodeURIComponent(query)}&maxResults=20`);
            if (!response.ok) throw new Error('Google Books API error');

            const data = await response.json();
            if (!data.items) return [];

            return data.items.map((item: any) => ({
                id: item.id,
                title: item.volumeInfo.title,
                authors: item.volumeInfo.authors || ['Bilinmeyen Yazar'],
                thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
                description: item.volumeInfo.description,
                pageCount: item.volumeInfo.pageCount,
                publishedDate: item.volumeInfo.publishedDate,
                publisher: item.volumeInfo.publisher,
            }));
        } catch (error) {
            console.error('Search books error:', error);
            return [];
        }
    },

    async getBookDetails(id: string): Promise<BookSearchResult | null> {
        try {
            const response = await fetch(`${GOOGLE_BOOKS_BASE_URL}/${id}`);
            if (!response.ok) throw new Error('Google Books API error');

            const item = await response.json();
            return {
                id: item.id,
                title: item.volumeInfo.title,
                authors: item.volumeInfo.authors || ['Bilinmeyen Yazar'],
                thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
                description: item.volumeInfo.description,
                pageCount: item.volumeInfo.pageCount,
                publishedDate: item.volumeInfo.publishedDate,
                publisher: item.volumeInfo.publisher,
            };
        } catch (error) {
            console.error('Get book details error:', error);
            return null;
        }
    }
};
