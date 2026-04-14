import { LayoutDashboard, Wallet, Activity, History, Settings } from 'lucide-react';

export const NAVIGATION_ITEMS = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
        description: 'Visão geral do portfólio e métricas principais.',
    },
    {
        id: 'contas',
        label: 'Contas',
        path: '/contas',
        icon: Wallet,
        description: 'Gerencie suas contas reais e de mesa proprietária.',
    },
    {
        id: 'operacoes',
        label: 'Operações',
        path: '/operacoes',
        icon: Activity,
        description: 'Registre e acompanhe suas operações de trading.',
    },
    {
        id: 'historico',
        label: 'Histórico',
        path: '/historico',
        icon: History,
        description: 'Visualize o histórico completo de todas as transações.',
    },
    {
        id: 'configuracoes',
        label: 'Configurações',
        path: '/configuracoes',
        icon: Settings,
        description: 'Gerencie opções e taxas da plataforma.',
    },
] as const;