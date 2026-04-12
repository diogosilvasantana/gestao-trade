import { Outlet, useLocation, Link } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../lib/navigation';

export function DashboardLayout() {
    const location = useLocation();

    return (
        <div className="min-h-screen flex bg-[var(--color-board-900)]">
            {/* SIDEBAR */}
            <aside className="w-64 bg-[var(--color-board-800)] border-r border-[var(--color-board-border)] flex flex-col">
                {/* Logo/Brand */}
                <div className="h-16 flex items-center px-6 border-b border-[var(--color-board-border)]">
                    <h1 className="text-lg font-bold tracking-tighter text-[var(--color-text-main)]">
                        DT Manager
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {NAVIGATION_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded transition-colors ${isActive
                                    ? 'bg-[var(--color-brand)] text-white'
                                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-board-700)] hover:text-[var(--color-text-main)]'
                                    }`}
                            >
                                <Icon className="w-4 h-4 mr-3" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Info */}
                <div className="p-4 border-t border-[var(--color-board-border)] text-xs text-[var(--color-text-muted)]">
                    <p>Versão 0.1.0 MVP</p>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* HEADER */}
                <header className="h-16 bg-[var(--color-board-800)] border-b border-[var(--color-board-border)] flex items-center justify-between px-8">
                    <div>
                        <h2 className="text-base font-semibold text-[var(--color-text-main)]">
                            {NAVIGATION_ITEMS.find((n) => n.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[var(--color-profit)] rounded-full"></div>
                            <span className="text-[var(--color-text-muted)]">Online</span>
                        </div>
                    </div>
                </header>

                {/* PAGE OUTLET */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-8">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}