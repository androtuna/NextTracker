import { Link, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Search, Settings, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import logo from '@/assets/logo.png';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { useEffect } from 'react';

export default function Layout() {
    const { t } = useTranslation();
    const settings = useLiveQuery(() => db.settings.get(1));

    useEffect(() => {
        const theme = settings?.theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        // Also update meta theme-color for mobile
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#09090b' : '#ffffff');
    }, [settings?.theme]);

    return (
        <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] font-sans overflow-hidden transition-colors duration-300">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex w-64 flex-col border-r border-[var(--border)] bg-[var(--card)] p-4">
                <Link to="/" className="flex items-center gap-3 px-2 py-4 mb-6">
                    <img src={logo} alt="NextTracker" className="size-10 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        NextTracker
                    </span>
                </Link>

                <nav className="flex flex-col gap-1 flex-1">
                    <NavItem to="/" icon={LayoutDashboard}>{t('dashboard')}</NavItem>
                    <NavItem to="/search" icon={Search}>{t('moviesAndSeries')}</NavItem>
                    <NavItem to="/books" icon={BookOpen}>{t('books')}</NavItem>
                    <NavItem to="/settings" icon={Settings}>{t('settings')}</NavItem>
                </nav>

                <div className="mt-auto px-2 py-4 text-xs text-gray-600">
                    v0.2.0 • Local First
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                <Outlet />
            </main>

            {/* Bottom Nav - Mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-lg flex justify-around p-2 pb-6 safe-area-pb z-50 transition-colors">
                <MobileNavItem to="/" icon={LayoutDashboard} label={t('dashboard')} />
                <MobileNavItem to="/search" icon={Search} label={t('search')} />
                <MobileNavItem to="/books" icon={BookOpen} label="Kitaplar" />
                <MobileNavItem to="/settings" icon={Settings} label={t('settings')} />
            </nav>
        </div>
    );
}

function NavItem({ to, icon: Icon, children }: { to: string, icon: any, children: React.ReactNode }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-[var(--accent)] hover:text-[var(--foreground)]",
                isActive ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium shadow-sm" : "text-[var(--muted-foreground)]"
            )}
        >
            <Icon className="size-5" />
            <span>{children}</span>
        </NavLink>
    );
}

function MobileNavItem({ to, icon: Icon, label }: { to: string, icon: any, label: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
            )}
        >
            <Icon className="size-6" />
            <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
    );
}
