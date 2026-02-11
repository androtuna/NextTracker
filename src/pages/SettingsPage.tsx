import { useState, useEffect } from 'react';
import { Save, CloudUpload, CloudDownload, RefreshCw, CheckCircle, AlertCircle, Globe, Database } from 'lucide-react';
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
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight">{t('settingsTitle')}</h1>
                <p className="text-gray-400 mt-2">{t('settingsDesc')}</p>
            </header>

            <div className="space-y-8">
                {/* Dil Ayarları */}
                <section className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Globe className="size-5 text-blue-500" />
                        {t('language')}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleChange('language', 'tr')}
                            className={`p-4 rounded-xl border text-center transition-all ${settings.language === 'tr' || !settings.language ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-gray-400 hover:bg-zinc-800 hover:text-gray-200'}`}
                        >
                            Türkçe
                        </button>
                        <button
                            onClick={() => handleChange('language', 'en')}
                            className={`p-4 rounded-xl border text-center transition-all ${settings.language === 'en' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-gray-400 hover:bg-zinc-800 hover:text-gray-200'}`}
                        >
                            English
                        </button>
                    </div>
                </section>

                {/* Veri Yedekleme ve Geri Yükleme */}
                <section className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Database className="size-32" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <Database className="size-6 text-green-500" />
                        Veri Yönetimi
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-lg">
                        Tüm koleksiyonunuzu güvenli bir JSON dosyası olarak cihazınıza yedekleyebilir veya daha önce aldığınız bir yedeği sisteme yükleyebilirsiniz.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            onClick={handleBackup}
                            disabled={status === 'syncing'}
                            className="flex flex-col items-center justify-center gap-4 p-8 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                        >
                            <div className="size-14 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CloudUpload className="size-7 text-blue-500" />
                            </div>
                            <div className="text-center">
                                <span className="block text-white font-semibold text-lg">Yedeği İndir</span>
                                <span className="text-sm text-gray-500">Tüm verileri .json olarak paketle</span>
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
                            <div className="flex flex-col items-center justify-center gap-4 p-8 bg-zinc-950 border border-zinc-800 rounded-2xl group-hover:border-red-500/50 group-hover:bg-red-500/5 transition-all">
                                <div className="size-14 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <CloudDownload className="size-7 text-red-500" />
                                </div>
                                <div className="text-center">
                                    <span className="block text-white font-semibold text-lg">Yedeği Yükle</span>
                                    <span className="text-sm text-gray-500">Mevcut verilerin üzerine yazılır</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {settings.lastSync && (
                        <div className="mt-8 flex items-center gap-2 text-sm text-gray-500 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 w-fit">
                            <RefreshCw className="size-4" />
                            Son Etkinlik: {new Date(settings.lastSync).toLocaleString()}
                        </div>
                    )}
                </section>

                {/* Alt Kaydetme Barı */}
                <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                    <div className="text-sm">
                        {status === 'success' && <span className="text-green-400 flex items-center gap-2 font-medium"><CheckCircle className="size-4" /> {message}</span>}
                        {status === 'error' && <span className="text-red-400 flex items-center gap-2 font-medium"><AlertCircle className="size-4" /> {message}</span>}
                        {status === 'syncing' && <span className="text-blue-400 flex items-center gap-2 font-medium"><RefreshCw className="size-4 animate-spin" /> {message}</span>}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={status !== 'idle' && status !== 'success' && status !== 'error'}
                        className="flex items-center gap-2 px-10 py-4 bg-white text-black hover:bg-gray-100 rounded-full font-bold transition-all shadow-xl shadow-white/5 active:scale-95"
                    >
                        <Save className="size-5" /> {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
