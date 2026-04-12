import { LayoutDashboard, Wallet, Activity, History } from 'lucide-react';

export const NAVIGATION_ITEMS = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
    },
    {
        id: 'contas',
        label: 'Contas',
        path: '/contas',
        icon: Wallet,
    },
    {
        id: 'operacoes',
        label: 'Operações',
        path: '/operacoes',
        icon: Activity,
    },
    {
        id: 'historico',
        label: 'Histórico',
        path: '/historico',
        icon: History,
    },
] as const;