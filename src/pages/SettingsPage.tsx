import { useState, useEffect } from 'react';
import { Save, CloudUpload, CloudDownload, RefreshCw, CheckCircle, AlertCircle, Globe, Database, Key, Settings } from 'lucide-react';
import { getSettings, saveSettings } from '@/db/db';
import { syncService } from '@/features/sync/syncService';
import type { AppSettings } from '@/types';
import { useTranslation } from '@/lib/i18n';

export default function SettingsPage() {
    const { t } = useTranslation();
    const [settings, setSettingsState] = useState<AppSettings>({});
    const [status, setStatus] = useState<'idle' | 'saving' | 'syncing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        getSettings().then(setSettingsState);
    }, []);

    const handleChange = (key: keyof AppSettings, value: string) => {
        setSettingsState(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setStatus('saving');
        try {
            await saveSettings(settings);
            setStatus('success');
            setMessage(t('saved'));
            setTimeout(() => setStatus('idle'), 2000);
        } catch (e) {
            setStatus('error');
            setMessage(t('saveError'));
        }
    };

    const handleBackup = async () => {
        setStatus('syncing');
        setMessage(t('backingUp'));
        try {
            const count = await syncService.exportToJSON();
            const s = await getSettings();
            setSettingsState(s);
            setStatus('success');
            setMessage(`${count} öğe başarıyla yedeklendi.`);
        } catch (e: any) {
            setStatus('error');
            setMessage(`${t('error')}: ${e.message}`);
        }
    };

    const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm(t('restoreConfirm'))) {
            event.target.value = '';
            return;
        }

        setStatus('syncing');
        setMessage(t('restoring'));
        try {
            const count = await syncService.importFromJSON(file);
            setStatus('success');
            setMessage(`${count} öğe başarıyla geri yüklendi.`);
            setTimeout(() => window.location.reload(), 1500);
        } catch (e: any) {
            setStatus('error');
            setMessage(`${t('error')}: ${e.message}`);
        } finally {
            event.target.value = '';
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10 text-[var(--foreground)]">
            <header>
                <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">{t('settingsTitle')}</h1>
                <p className="text-[var(--muted-foreground)] mt-2">{t('settingsDesc')}</p>
            </header>

            <div className="space-y-8">
                {/* Tema Ayarları */}
                <section className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] shadow-xl">
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                        <Database className="size-5 text-purple-500" />
                        Görünüm (Tema)
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleChange('theme', 'dark')}
                            className={`p-4 rounded-xl border text-center transition-all ${settings.theme === 'dark' || !settings.theme ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[var(--input)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'}`}
                        >
                            Karanlık
                        </button>
                        <button
                            onClick={() => handleChange('theme', 'light')}
                            className={`p-4 rounded-xl border text-center transition-all ${settings.theme === 'light' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[var(--input)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'}`}
                        >
                            Aydınlık
                        </button>
                    </div>
                </section>

                {/* Bağlantı Ayarları */}
                <section className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] shadow-xl">
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                        <Settings className="size-5 text-blue-500" />
                        Bağlantı Ayarları
                    </h2>
                    <p className="text-sm text-[var(--muted-foreground)] mb-6">
                        Uygulamanın film verilerini çekebilmesi için TMDB bağlantısı gereklidir. Varsayılan olarak sunucu üzerindeki güvenli proxy kullanılır.
                    </p>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--muted-foreground)] flex items-center gap-2">
                                <Key className="size-4" />
                                Kendi TMDB API Anahtarım (Opsiyonel)
                            </label>
                            <input
                                type="password"
                                value={settings.tmdbApiKey || ''}
                                onChange={(e) => handleChange('tmdbApiKey', e.target.value)}
                                placeholder="T3S5T..."
                                className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-[var(--muted-foreground)]/30"
                            />
                            <p className="text-[11px] text-[var(--muted-foreground)] opacity-70">
                                * Eğer lokal kurulumda sunucu (server.js) çalıştırmıyorsanız kendi API anahtarınızı girmelisiniz. Boş bırakılırsa sunucu proxy'si kullanılır.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Dil Ayarları */}
                <section className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] shadow-xl">
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                        <Globe className="size-5 text-blue-500" />
                        {t('language')}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleChange('language', 'tr')}
                            className={`p-4 rounded-xl border text-center transition-all ${settings.language === 'tr' || !settings.language ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[var(--input)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'}`}
                        >
                            Türkçe
                        </button>
                        <button
                            onClick={() => handleChange('language', 'en')}
                            className={`p-4 rounded-xl border text-center transition-all ${settings.language === 'en' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[var(--input)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'}`}
                        >
                            English
                        </button>
                    </div>
                </section>

                {/* Veri Yedekleme ve Geri Yükleme */}
                <section className="bg-[var(--card)] rounded-2xl p-8 border border-[var(--border)] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Database className="size-32" />
                    </div>

                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2 flex items-center gap-3">
                        <Database className="size-6 text-green-500" />
                        Veri Yönetimi
                    </h2>
                    <p className="text-[var(--muted-foreground)] mb-8 max-w-lg">
                        Tüm koleksiyonunuzu güvenli bir JSON dosyası olarak cihazınıza yedekleyebilir veya daha önce aldığınız bir yedeği sisteme yükleyebilirsiniz.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            onClick={handleBackup}
                            disabled={status === 'syncing'}
                            className="flex flex-col items-center justify-center gap-4 p-8 bg-[var(--input)] border border-[var(--border)] rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                        >
                            <div className="size-14 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CloudUpload className="size-7 text-blue-500" />
                            </div>
                            <div className="text-center">
                                <span className="block text-[var(--foreground)] font-semibold text-lg">Yedeği İndir</span>
                                <span className="text-sm text-[var(--muted-foreground)]">Tüm verileri .json olarak paketle</span>
                            </div>
                        </button>

                        <div className="relative group">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleRestore}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                disabled={status === 'syncing'}
                            />
                            <div className="flex flex-col items-center justify-center gap-4 p-8 bg-[var(--input)] border border-[var(--border)] rounded-2xl group-hover:border-red-500/50 group-hover:bg-red-500/5 transition-all">
                                <div className="size-14 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <CloudDownload className="size-7 text-red-500" />
                                </div>
                                <div className="text-center">
                                    <span className="block text-[var(--foreground)] font-semibold text-lg">Yedeği Yükle</span>
                                    <span className="text-sm text-[var(--muted-foreground)]">Mevcut verilerin üzerine yazılır</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {settings.lastSync && (
                        <div className="mt-8 flex items-center gap-2 text-sm text-[var(--muted-foreground)] bg-[var(--input)]/50 p-4 rounded-xl border border-[var(--border)]/50 w-fit">
                            <RefreshCw className="size-4" />
                            Son Etkinlik: {new Date(settings.lastSync).toLocaleString()}
                        </div>
                    )}
                </section>

                {/* Alt Kaydetme Barı */}
                <div className="flex items-center justify-between pt-6 border-t border-[var(--border)]">
                    <div className="text-sm">
                        {status === 'success' && <span className="text-green-400 flex items-center gap-2 font-medium"><CheckCircle className="size-4" /> {message}</span>}
                        {status === 'error' && <span className="text-red-400 flex items-center gap-2 font-medium"><AlertCircle className="size-4" /> {message}</span>}
                        {status === 'syncing' && <span className="text-blue-400 flex items-center gap-2 font-medium"><RefreshCw className="size-4 animate-spin" /> {message}</span>}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={status !== 'idle' && status !== 'success' && status !== 'error'}
                        className="flex items-center gap-2 px-10 py-4 bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 rounded-full font-bold transition-all shadow-xl active:scale-95"
                    >
                        <Save className="size-5" /> {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
