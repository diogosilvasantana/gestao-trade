// frontend/src/pages/Dashboard.tsx
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

function StatCard({ label, value, change, isProfit }: any) {
    return (
        <div className="card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold mb-1">
                        {label}
                    </p>
                    <p className="text-2xl font-bold text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-mono)' }}>
                        {value}
                    </p>
                </div>
                <div className={`p-3 rounded ${isProfit ? 'bg-[var(--color-profit-dim)]' : 'bg-[var(--color-loss-dim)]'}`}>
                    {isProfit ? (
                        <TrendingUp className={`w-5 h-5 text-[var(--color-profit-bright)]`} />
                    ) : (
                        <TrendingDown className={`w-5 h-5 text-[var(--color-loss-bright)]`} />
                    )}
                </div>
            </div>
            {change && (
                <p className={`text-xs mt-3 font-semibold ${isProfit ? 'text-[var(--color-profit-bright)]' : 'text-[var(--color-loss-bright)]'}`}>
                    {isProfit ? '↑' : '↓'} {change}%
                </p>
            )}
        </div>
    );
}

export function Dashboard() {
    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Bem-vindo, Trader
                </h1>
                <p className="text-[var(--color-text-muted)]">
                    Acompanhe seu portfólio em tempo real. Dashboard em desenvolvimento — em breve, gráficos de P&L e métricas detalhadas.
                </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Saldo Total" value="R$ 15.250,00" change="12.5" isProfit={true} />
                <StatCard label="P&L Dia" value="R$ 1.320,00" change="8.2" isProfit={true} />
                <StatCard label="P&L Mês" value="R$ 5.890,00" change="5.1" isProfit={true} />
                <StatCard label="Contratos Ativos" value="3" change={null} isProfit={true} />
            </div>

            {/* Secondary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Próximas Operações */}
                <div className="lg:col-span-2 card">
                    <h2 className="text-lg font-bold text-[var(--color-text-main)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                        Operações Recentes
                    </h2>
                    <p className="text-[var(--color-text-muted)] text-sm">
                        Ainda não há operações registradas. Inicie sua primeira operação na seção de operações.
                    </p>
                </div>

                {/* Status Rápido */}
                <div className="card">
                    <h3 className="text-lg font-bold text-[var(--color-text-main)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                        Status
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-muted)]">Contas Ativas</span>
                            <span className="badge-profit">0</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-muted)]">Rollback Configurado</span>
                            <span className="badge-alert">Sim</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-muted)]">Taxa Sucesso (Mês)</span>
                            <span className="text-[var(--color-profit-bright)] font-semibold">—</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}