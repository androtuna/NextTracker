import { Link, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import logo from '@/assets/logo.png';

export default function Layout() {
    const { t } = useTranslation();

    return (
        <div className="flex h-screen bg-black text-gray-100 font-sans overflow-hidden">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex w-64 flex-col border-r border-gray-800 bg-zinc-950 p-4">
                <Link to="/" className="flex items-center gap-3 px-2 py-4 mb-6">
                    <img src={logo} alt="NextTracker" className="size-10 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        NextTracker
                    </span>
                </Link>

                <nav className="flex flex-col gap-1 flex-1">
                    <NavItem to="/" icon={LayoutDashboard}>{t('dashboard')}</NavItem>
                    <NavItem to="/search" icon={Search}>{t('search')}</NavItem>
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
            <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-zinc-950/90 backdrop-blur-lg flex justify-around p-2 pb-6 safe-area-pb z-50">
                <MobileNavItem to="/" icon={LayoutDashboard} label={t('dashboard')} />
                <MobileNavItem to="/search" icon={Search} label={t('search')} />
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
                "hover:bg-zinc-900 hover:text-white",
                isActive ? "bg-zinc-800 text-blue-400 font-medium shadow-sm" : "text-gray-400"
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
                isActive ? "text-blue-400" : "text-gray-500"
            )}
        >
            <Icon className="size-6" />
            <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
    );
}
