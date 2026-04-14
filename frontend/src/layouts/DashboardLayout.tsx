import { Outlet, useLocation, Link } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../lib/navigation';
import { ChevronRight, Settings } from 'lucide-react';

export function DashboardLayout() {
    const location = useLocation();
    const currentPage = NAVIGATION_ITEMS.find((n) => n.path === location.pathname);

    return (
        <div className="min-h-screen flex bg-[var(--color-navy-950)]">
            {/* SIDEBAR */}
            <aside className="w-56 bg-[var(--color-navy-800)] border-r border-[var(--color-border)] flex flex-col" role="navigation" aria-label="Navegação principal">
                {/* Logo */}
                <div className="h-14 flex items-center px-5 border-b border-[var(--color-border)]">
                    <span className="text-base font-bold tracking-tight text-[var(--color-text-main)]">
                        DT Manager
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1" aria-label="Menu">
                    {NAVIGATION_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                aria-current={isActive ? 'page' : undefined}
                                className={`relative flex items-center px-3 py-2 text-sm font-medium rounded-sm transition-colors duration-150 ease-in-out group hover:scale-[1.02] origin-left ${isActive
                                        ? 'bg-[var(--color-brand)] text-white'
                                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-navy-700)] hover:text-[var(--color-text-main)]'
                                    } focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]`}
                            >
                                {/* Border-left highlight */}
                                <span className={`absolute left-0 top-0 h-full w-1 ${isActive ? 'bg-white' : 'group-hover:bg-[var(--color-brand)]'}`} aria-hidden="true"></span>

                                <Icon className="w-4 h-4 mr-2.5" aria-hidden="true" />
                                <span>{item.label}</span>
                                {isActive && <ChevronRight className="w-3 h-3 ml-auto" aria-hidden="true" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)] space-y-2">
                    <p className="font-semibold text-[var(--color-text-secondary)]">Sistema</p>
                    <p>v0.1.0 MVP</p>
                    <div className="flex items-center gap-2 pt-2">
                        <div className="status-pulse" aria-hidden="true"></div>
                        <span>Online</span>
                    </div>
                </div>
            </aside>

            {/* MAIN */}
            <main id="main-content" className="flex-1 flex flex-col overflow-hidden" tabIndex={-1}>
                {/* HEADER */}
                <header className="h-14 bg-[var(--color-navy-800)] border-b border-[var(--color-border)] flex items-center justify-between px-8">
                    <div>
                        <h1 className="text-base font-bold text-[var(--color-text-main)]">
                            {currentPage?.label || 'Dashboard'}
                        </h1>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {currentPage?.description || 'Gerenciamento financeiro inteligente.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-2 bg-[var(--color-navy-700)] px-3 py-2 rounded-sm">
                            <div className="w-1.5 h-1.5 bg-[var(--color-success)] rounded-full animate-pulse" aria-hidden="true"></div>
                            <span className="text-[var(--color-text-secondary)]">Sistema operacional</span>
                        </div>
                    </div>
                </header>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}