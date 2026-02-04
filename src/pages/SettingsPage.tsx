import { useState, useEffect } from 'react';
import { Save, CloudUpload, CloudDownload, RefreshCw, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import { getSettings, saveSettings } from '@/db/db';
import { syncService } from '@/features/sync/syncService';
import type { AppSettings } from '@/types';
import { webdavClient } from '@/features/sync/webdav';
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

            // Force reload to apply language change if any
            // Ideally we should use context api but for now liveQuery handles reads, 
            // but static UI parts might need re-render or reload.
            // Since useTranslation reads from liveQuery, it should be reactive for components using it.
        } catch (e) {
            setStatus('error');
            setMessage(t('saveError'));
        }
    };

    const handleTestConnection = async () => {
        setStatus('syncing');
        setMessage(t('testing'));
        try {
            const ok = await webdavClient.checkConnection();
            if (ok === true) {
                setStatus('success');
                setMessage(t('testSuccess'));
            } else {
                // If it returns a string, it's an error message
                setStatus('error');
                setMessage(typeof ok === 'string' ? ok : t('testFail'));
            }
        } catch (e: any) {
            setStatus('error');
            setMessage(e.message || t('testFail'));
        }
    };

    const handleBackup = async () => {
        setStatus('syncing');
        setMessage(t('backingUp'));
        try {
            await syncService.backup();
            setStatus('success');
            setMessage(t('backupSuccess'));
        } catch (e: any) {
            setStatus('error');
            setMessage(`${t('error')}: ${e.message}`);
        }
    };

    const handleRestore = async () => {
        if (!confirm(t('restoreConfirm'))) return;

        setStatus('syncing');
        setMessage(t('restoring'));
        try {
            await syncService.restore();
            setStatus('success');
            setMessage(t('restoreSuccess'));
            setTimeout(() => window.location.reload(), 1500);
        } catch (e: any) {
            setStatus('error');
            setMessage(`${t('error')}: ${e.message}`);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight">{t('settingsTitle')}</h1>
                <p className="text-gray-400 mt-2">{t('settingsDesc')}</p>
            </header>

            <div className="space-y-8">
                {/* Language Configuration */}
                <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Globe className="size-5 text-blue-500" />
                        {t('language')}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleChange('language', 'tr')}
                            className={`p-4 rounded-lg border text-center transition-all ${settings.language === 'tr' || !settings.language ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-gray-400 hover:bg-zinc-800'}`}
                        >
                            Türkçe
                        </button>
                        <button
                            onClick={() => handleChange('language', 'en')}
                            className={`p-4 rounded-lg border text-center transition-all ${settings.language === 'en' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-gray-400 hover:bg-zinc-800'}`}
                        >
                            English
                        </button>
                    </div>
                </section>

                {/* API Configuration */}
                <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        {t('apiConfig')}
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t('tmdbApiKey')}</label>
                            <input
                                type="password"
                                value={settings.tmdbApiKey || ''}
                                onChange={e => handleChange('tmdbApiKey', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                placeholder="TMDB API Key"
                            />
                            <p className="text-xs text-gray-600 mt-2">{t('tmdbDesc')}</p>
                        </div>
                    </div>
                </section>

                {/* Sync Configuration */}
                <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        {t('syncConfig')}
                    </h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">{t('serverUrl')}</label>
                                <input
                                    type="text"
                                    value={settings.nextcloudUrl || ''}
                                    onChange={e => handleChange('nextcloudUrl', e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    placeholder="https://cloud.example.com/remote.php/dav/files/user/"
                                />
                                <p className="text-xs text-gray-600 mt-1">{t('serverUrlDesc')}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">{t('username')}</label>
                                <input
                                    type="text"
                                    value={settings.nextcloudUsername || ''}
                                    onChange={e => handleChange('nextcloudUsername', e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t('password')}</label>
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
                                {t('testConnection')}
                            </button>

                            <div className="ml-auto flex gap-3">
                                <button
                                    onClick={handleRestore}
                                    disabled={status === 'syncing'}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded-lg text-sm font-medium transition-colors border border-red-900/50"
                                >
                                    <CloudDownload className="size-4" /> {t('restore')}
                                </button>
                                <button
                                    onClick={handleBackup}
                                    disabled={status === 'syncing'}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 rounded-lg text-sm font-medium transition-colors border border-blue-900/50"
                                >
                                    <CloudUpload className="size-4" /> {t('backup')}
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
                        <Save className="size-4" /> {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
