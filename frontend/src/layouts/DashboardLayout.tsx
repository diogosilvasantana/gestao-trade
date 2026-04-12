// frontend/src/layouts/DashboardLayout.tsx
import { Outlet, useLocation, Link } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../lib/navigation';
import { ChevronRight } from 'lucide-react';

export function DashboardLayout() {
    const location = useLocation();

    const currentPage = NAVIGATION_ITEMS.find((n) => n.path === location.pathname);

    return (
        <div className="min-h-screen flex bg-[var(--color-navy-900)]">
            {/* SIDEBAR: Minimalista, apertado, hierarquia clara */}
            <aside className="w-56 bg-[var(--color-navy-800)] border-r border-[var(--color-navy-border)] flex flex-col">
                {/* Logo: Syne font, tracking-tighter */}
                <div className="h-14 flex items-center px-5 border-b border-[var(--color-navy-border)]">
                    <h1 className="text-sm font-bold tracking-tighter text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-display)' }}>
                        DT Manager
                    </h1>
                </div>

                {/* Navigation: Sem extra spacing, cards com estado claro */}
                <nav className="flex-1 p-3 space-y-1">
                    {NAVIGATION_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded transition-all group ${isActive
                                        ? 'bg-[var(--color-brand)] text-white'
                                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-navy-700)] hover:text-[var(--color-text-secondary)]'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 mr-2.5 ${isActive ? 'text-white' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]'}`} />
                                <span>{item.label}</span>
                                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Info: Versão, status */}
                <div className="p-4 border-t border-[var(--color-navy-border)] text-xs text-[var(--color-text-muted)] space-y-2">
                    <p className="font-semibold text-[var(--color-text-secondary)]">Sistema</p>
                    <p>v0.1.0 MVP</p>
                    <div className="flex items-center gap-2 pt-2">
                        <div className="w-2 h-2 bg-[var(--color-profit-bright)] rounded-full animate-pulse"></div>
                        <span>Online</span>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* HEADER: Limpo, hierarquia, sem clutter */}
                <header className="h-14 bg-[var(--color-navy-800)] border-b border-[var(--color-navy-border)] flex items-center justify-between px-8">
                    <div>
                        <h2
                            className="text-base font-bold text-[var(--color-text-main)]"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            {currentPage?.label || 'Dashboard'}
                        </h2>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {currentPage?.label === 'Dashboard' ? 'Visão geral do portfólio' : `Gerenciamento de ${currentPage?.label.toLowerCase()}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-2 bg-[var(--color-navy-700)] px-3 py-2 rounded">
                            <div className="w-1.5 h-1.5 bg-[var(--color-profit-bright)] rounded-full"></div>
                            <span className="text-[var(--color-text-secondary)]">Sistema operacional</span>
                        </div>
                    </div>
                </header>

                {/* PAGE OUTLET: Espaçamento respirado */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-8">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}