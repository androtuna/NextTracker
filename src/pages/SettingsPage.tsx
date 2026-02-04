import { useState, useEffect } from 'react';
import { Save, CloudUpload, CloudDownload, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { getSettings, saveSettings } from '@/db/db';
import { syncService } from '@/features/sync/syncService';
import type { AppSettings } from '@/types';
import { webdavClient } from '@/features/sync/webdav';

export default function SettingsPage() {
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
            setMessage('Ayarlar kaydedildi.');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (e) {
            setStatus('error');
            setMessage('Kaydedilemedi.');
        }
    };

    const handleTestConnection = async () => {
        setStatus('syncing');
        setMessage('Bağlantı test ediliyor...');
        const ok = await webdavClient.checkConnection();
        if (ok) {
            setStatus('success');
            setMessage('Nextcloud bağlantısı başarılı!');
        } else {
            setStatus('error');
            setMessage('Bağlantı başarısız. Bilgileri kontrol edin.');
        }
    };

    const handleBackup = async () => {
        setStatus('syncing');
        setMessage('Yedekleniyor...');
        try {
            await syncService.backup();
            setStatus('success');
            setMessage('Yedekleme başarılı!');
        } catch (e: any) {
            setStatus('error');
            setMessage(`Hata: ${e.message}`);
        }
    };

    const handleRestore = async () => {
        if (!confirm('Yerel veriler silinecek ve yedekten geri yüklenecek. Onaylıyor musunuz?')) return;

        setStatus('syncing');
        setMessage('Geri yükleniyor...');
        try {
            await syncService.restore();
            setStatus('success');
            setMessage('Geri yükleme tamamlandı! Sayfa yenileniyor...');
            setTimeout(() => window.location.reload(), 1500);
        } catch (e: any) {
            setStatus('error');
            setMessage(`Hata: ${e.message}`);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight">Ayarlar</h1>
                <p className="text-gray-400 mt-2">Uygulama yapılandırması ve veri yönetimi.</p>
            </header>

            <div className="space-y-8">
                {/* API Configuration */}
                <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        API Yapılandırması
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">TMDB API Key (v3 Auth)</label>
                            <input
                                type="password"
                                value={settings.tmdbApiKey || ''}
                                onChange={e => handleChange('tmdbApiKey', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                placeholder="TMDB API anahtarınızı girin"
                            />
                            <p className="text-xs text-gray-600 mt-2">Film verilerini çekmek için gereklidir in TheMovieDB.</p>
                        </div>
                    </div>
                </section>

                {/* Sync Configuration */}
                <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        Nextcloud Senkronizasyon
                    </h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Sunucu URL</label>
                                <input
                                    type="text"
                                    value={settings.nextcloudUrl || ''}
                                    onChange={e => handleChange('nextcloudUrl', e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    placeholder="https://cloud.example.com/remote.php/dav/files/user/"
                                />
                                <p className="text-xs text-gray-600 mt-1">WebDAV URL'nizi girin.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Kullanıcı Adı</label>
                                <input
                                    type="text"
                                    value={settings.nextcloudUsername || ''}
                                    onChange={e => handleChange('nextcloudUsername', e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Şifre / App Password</label>
                            <input
                                type="password"
                                value={settings.nextcloudPassword || ''}
                                onChange={e => handleChange('nextcloudPassword', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                            />
                        </div>

                        <div className="pt-2 flex flex-wrap gap-4">
                            <button
                                onClick={handleTestConnection}
                                disabled={status === 'syncing' || status === 'saving'}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Bağlantıyı Test Et
                            </button>

                            <div className="ml-auto flex gap-3">
                                <button
                                    onClick={handleRestore}
                                    disabled={status === 'syncing'}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded-lg text-sm font-medium transition-colors border border-red-900/50"
                                >
                                    <CloudDownload className="size-4" /> Geri Yükle
                                </button>
                                <button
                                    onClick={handleBackup}
                                    disabled={status === 'syncing'}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 rounded-lg text-sm font-medium transition-colors border border-blue-900/50"
                                >
                                    <CloudUpload className="size-4" /> Yedekle
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Global Save */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <div className="text-sm">
                        {status === 'success' && <span className="text-green-400 flex items-center gap-2"><CheckCircle className="size-4" /> {message}</span>}
                        {status === 'error' && <span className="text-red-400 flex items-center gap-2"><AlertCircle className="size-4" /> {message}</span>}
                        {status === 'syncing' && <span className="text-blue-400 flex items-center gap-2"><RefreshCw className="size-4 animate-spin" /> {message}</span>}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={status !== 'idle' && status !== 'success' && status !== 'error'}
                        className="flex items-center gap-2 px-8 py-3 bg-white text-black hover:bg-gray-200 rounded-full font-medium transition-colors shadow-lg shadow-white/10"
                    >
                        <Save className="size-4" /> Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}
