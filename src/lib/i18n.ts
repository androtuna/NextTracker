import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';

type Language = 'tr' | 'en';

const translations = {
    tr: {
        dashboard: 'Panel',
        search: 'Keşfet',
        settings: 'Ayarlar',
        watchList: 'İzleme Listem',
        watchListDesc: 'Takip ettiğiniz içerikler burada görüntülenir.',
        planned: 'Planlanan',
        watching: 'İzleniyor',
        completed: 'Tamamlanan',
        dropped: 'Bırakıldı',
        all: 'Tümü',
        details: 'Detaylar',
        movie: 'Film',
        series: 'Dizi',
        emptyList: 'Listeniz boş.',
        emptyCategory: 'Bu kategoride içerik yok.',
        emptyListAction: 'sayfasından içerik ekleyin.',
        addContent: 'Keşfet',
        searchPlaceholder: 'Film veya dizi ara...',
        add: 'Ekle',
        added: 'Eklendi',
        noImage: 'Görsel Yok',
        settingsTitle: 'Ayarlar',
        trending: "Haftanın Trendleri",
        popularMovies: "Popüler Filmler",
        popularTV: "Popüler Diziler",
        topRated: "En Çok Beğenilenler",
        addToList: "Listeme Ekle",
        inList: "Listende",

        settingsDesc: 'Uygulama yapılandırması ve veri yönetimi.',
        apiConfig: 'API Yapılandırması',
        tmdbApiKey: 'TMDB API Key (v3 Auth)',
        tmdbDesc: 'Film verilerini çekmek için gereklidir.',
        syncConfig: 'Veri Yönetimi',
        save: 'Kaydet',
        saved: 'Ayarlar kaydedildi.',
        saveError: 'Kaydedilemedi.',
        backingUp: 'Veriler hazırlanıyor...',
        backupSuccess: 'Yedekleme başarılı!',
        restoring: 'Veriler yükleniyor...',
        restoreConfirm: 'Mevcut tüm verileriniz silinecek ve bu yedek dosyasındaki veriler yüklenecektir. Devam etmek istiyor musunuz?',
        restoreSuccess: 'Veriler başarıyla geri yüklendi! Sayfa yenileniyor...',
        backupDesc: 'Koleksiyonunuzu JSON dosyası olarak cihazınıza yedekleyin.',
        downloadBackup: 'Yedeği İndir',
        restoreBackup: 'Yedeği Yükle',
        error: 'Hata',
        language: 'Dil / Language',
        lastSync: 'Son Etkinlik',
    },
    en: {
        dashboard: 'Dashboard',
        search: 'Discover',
        settings: 'Settings',
        watchList: 'My Watchlist',
        watchListDesc: 'Your tracked content appears here.',
        planned: 'Planned',
        watching: 'Watching',
        completed: 'Completed',
        dropped: 'Dropped',
        all: 'All',
        details: 'Details',
        movie: 'Movie',
        series: 'Series',
        emptyList: 'Your list is empty.',
        emptyCategory: 'No content in this category.',
        emptyListAction: 'page to add content.',
        addContent: 'Discover',
        searchPlaceholder: 'Search for movies or TV shows...',
        add: 'Add',
        added: 'Added',
        noImage: 'No Image',
        settingsTitle: 'Settings',
        trending: "Trending This Week",
        popularMovies: "Popular Movies",
        popularTV: "Popular TV Shows",
        topRated: "Top Rated",
        addToList: "Add to List",
        inList: "In List",

        settingsDesc: 'Application configuration and data management.',
        apiConfig: 'API Configuration',
        tmdbApiKey: 'TMDB API Key (v3 Auth)',
        tmdbDesc: 'Required to fetch movie data.',
        syncConfig: 'Data Management',
        save: 'Save',
        saved: 'Settings saved.',
        saveError: 'Could not save.',
        backingUp: 'Preparing data...',
        backupSuccess: 'Backup successful!',
        restoring: 'Restoring data...',
        restoreConfirm: 'All existing data will be replaced with this backup. Do you want to continue?',
        restoreSuccess: 'Data restored successfully! Refreshing page...',
        backupDesc: 'Backup your collection to your device as a JSON file.',
        downloadBackup: 'Download Backup',
        restoreBackup: 'Restore Backup',
        error: 'Error',
        language: 'Language',
        lastSync: 'Last Activity',
    }
};

export function useTranslation() {
    const settings = useLiveQuery(() => db.settings.get(1));
    const lang: Language = settings?.language || 'tr';

    const t = (key: keyof typeof translations['tr']) => {
        return translations[lang][key] || key;
    };

    return { t, lang };
}
