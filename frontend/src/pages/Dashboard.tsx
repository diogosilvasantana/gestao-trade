// frontend/src/pages/Dashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Wallet, Building2, RefreshCw, Activity } from 'lucide-react';
import { contasApi, operacoesApi, Conta, Operacao, formatBRL, formatDate, isProfit } from '../lib/api';

// ── StatCard ──────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string;
    sub?: string;
    profit?: boolean;
    loading?: boolean;
}

function StatCard({ label, value, sub, profit, loading }: StatCardProps) {
    if (loading) {
        return (
            <div className="card animate-pulse">
                <div className="h-3 bg-[var(--color-navy-700)] rounded w-1/2 mb-3" />
                <div className="h-7 bg-[var(--color-navy-700)] rounded w-2/3" />
            </div>
        );
    }
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
                {profit !== undefined && (
                    <div className={`p-3 rounded ${profit ? 'bg-[var(--color-profit-dim)]' : 'bg-[var(--color-loss-dim)]'}`}>
                        {profit
                            ? <TrendingUp className="w-5 h-5 text-[var(--color-profit-bright)]" aria-hidden="true" />
                            : <TrendingDown className="w-5 h-5 text-[var(--color-loss-bright)]" aria-hidden="true" />
                        }
                    </div>
                )}
            </div>
            {sub && (
                <p className={`text-xs mt-3 font-semibold ${profit ? 'text-[var(--color-profit-bright)]' : 'text-[var(--color-loss-bright)]'}`}>
                    {sub}
                </p>
            )}
        </div>
    );
}

// ── Conta Row ─────────────────────────────────────────────────────────────

function ContaRow({ conta, ops }: { conta: Conta, ops: Operacao[] }) {
    const isReal = conta.tipo === 'Real';
    const saldoAtual = parseFloat(conta.saldoAtual);
    const saldoInicial = parseFloat(conta.saldoInicial);
    
    const resLiquido = isReal ? (saldoAtual - saldoInicial) : saldoAtual;
    const taxasDaConta = ops.reduce((acc, op) => acc + parseFloat(op.comissao || '0'), 0);
    const resBruto = resLiquido + taxasDaConta;

    return (
        <tr>
            <td>
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${isReal ? 'bg-[var(--color-brand-dim)]' : 'bg-[var(--color-warning-dim)]'}`}>
                        {isReal
                            ? <Wallet className="w-3 h-3 text-[var(--color-brand)]" aria-hidden="true" />
                            : <Building2 className="w-3 h-3 text-[var(--color-warning)]" aria-hidden="true" />
                        }
                    </div>
                    <div>
                        <p className="font-semibold text-[var(--color-text-main)] text-sm">
                            {isReal ? conta.contaReal?.corretora : conta.descricao}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            {isReal ? `${conta.contaReal?.tipoOperacao} • ${conta.contaReal?.moeda}` : conta.contaMesa?.tipo}
                        </p>
                    </div>
                </div>
            </td>
            <td style={{ fontFamily: 'var(--font-mono)' }} className="font-semibold text-[var(--color-text-main)]">
                {formatBRL(conta.saldoAtual)}
            </td>
            <td className="text-center">
                {isReal
                    ? <span className="font-bold text-[var(--color-brand)]">{conta.contaReal?.contratosAtuais}</span>
                    : <span className="text-[var(--color-text-muted)]">—</span>
                }
            </td>
            <td style={{ fontFamily: 'var(--font-mono)', color: resLiquido >= 0 ? 'var(--color-profit-bright)' : 'var(--color-loss-bright)', fontWeight: 700 }}>
                {resLiquido >= 0 ? '+' : ''}{formatBRL(resLiquido)}
            </td>
            <td style={{ fontFamily: 'var(--font-mono)', color: resBruto >= 0 ? 'var(--color-profit-bright)' : 'var(--color-loss-bright)', fontWeight: 700 }}>
                {resBruto >= 0 ? '+' : ''}{formatBRL(resBruto)}
            </td>
            <td>
                <span className={conta.status === 'Ativa' ? 'badge-success' : 'badge-warning'}>
                    {conta.status}
                </span>
            </td>
        </tr>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export function Dashboard() {
    const [contas, setContas] = useState<Conta[]>([]);
    const [todasOperacoes, setTodasOperacoes] = useState<Operacao[]>([]);
    const [loading, setLoading] = useState(true);

    const carregar = useCallback(async () => {
        setLoading(true);
        try {
            const [contsData, opsData] = await Promise.all([
                contasApi.listar(),
                operacoesApi.listar(),
            ]);
            setContas(contsData);
            setTodasOperacoes(opsData);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    // Separação Lógica de Contas
    const contasReal = contas.filter(c => c.tipo === 'Real');
    const contasMesa = contas.filter(c => c.tipo === 'MesaProprietaria');

    // Métricas Reais
    const saldoTotalReal = contasReal.reduce((acc, c) => acc + parseFloat(c.saldoAtual), 0);
    const inicialReal = contasReal.reduce((acc, c) => acc + parseFloat(c.saldoInicial), 0);
    const pnlReal = saldoTotalReal - inicialReal;
    const contratosReal = contasReal.reduce((acc, c) => acc + (c.contaReal?.contratosAtuais ?? 0), 0);

    // Métricas Mesa
    const pnlMesa = contasMesa.reduce((acc, c) => acc + parseFloat(c.saldoAtual), 0); // Nas mesas saldoAtual = P&L puro
    const margemMesa = contasMesa.reduce((acc, c) => acc + parseFloat(c.saldoInicial), 0); 

    // Métricas Operacionais
    const hoje = new Date();
    const opsHoje = todasOperacoes.filter(op => {
        const d = new Date(op.data);
        return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth() && d.getDate() === hoje.getDate();
    });
    const pnlDia = opsHoje.reduce((acc, op) => acc + parseFloat(op.resultado), 0);

    const qtdTotal = todasOperacoes.length;
    const qtdGains = todasOperacoes.filter(op => isProfit(op.resultado)).length;
    const winRate = qtdTotal > 0 ? (qtdGains / qtdTotal) * 100 : 0;
    
    const taxasB3 = todasOperacoes.reduce((acc, op) => acc + parseFloat(op.comissao || '0'), 0);
    const totalLiquido = todasOperacoes.reduce((acc, op) => acc + parseFloat(op.resultado), 0);
    const totalBruto = totalLiquido + taxasB3; // Como comissao é abatida, Bruto = Liquido + comissao

    const operacoesRecentes = todasOperacoes.slice(0, 5);

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Welcome */}
            <div className="flex items-start justify-between bg-gradient-to-r from-[var(--color-navy-800)] to-[var(--color-navy-900)] p-6 rounded-2xl border border-[var(--color-navy-700)] shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Activity className="text-[var(--color-brand-primary)]" />
                        Visão Estratégica
                    </h1>
                    <p className="text-[var(--color-text-muted)] font-semibold">
                        {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(hoje)}
                    </p>
                </div>
                <button onClick={carregar} className="btn-secondary flex gap-2 items-center" aria-label="Atualizar dados">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--color-brand-primary)]' : ''}`} />
                    Atualizar
                </button>
            </div>

            {/* Métricas do Trader (Alta Relevância) */}
            <div>
                <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-4 ml-1">Performance Global (Médias)</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Resultado Líquido"
                        value={loading ? '—' : formatBRL(totalLiquido)}
                        loading={loading}
                        profit={totalLiquido >= 0}
                    />
                    <StatCard
                        label="Resultado Bruto"
                        value={loading ? '—' : formatBRL(totalBruto)}
                        loading={loading}
                        profit={totalBruto >= 0}
                        sub="Sem abater os custos operacionais"
                    />
                    <StatCard
                        label="Custos e Taxas B3"
                        value={loading ? '—' : formatBRL(-taxasB3)}
                        loading={loading}
                        profit={false}
                        sub="Soma de Emolumentos + Corretagem"
                    />
                    <StatCard
                        label="Taxa de Acertos"
                        value={loading ? '—' : `${winRate.toFixed(1)}%`}
                        loading={loading}
                        profit={winRate >= 50}
                        sub={`${qtdTotal} operações registradas no total`}
                    />
                </div>
            </div>

            {/* Divisão: Conta Real x Mesa Proprietária */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* BLOC: CONTA REAL */}
                <div className="card border-l-4 border-l-[var(--color-brand-primary)]">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[var(--color-navy-700)]">
                        <Wallet className="w-5 h-5 text-[var(--color-brand-primary)]" />
                        <h2 className="text-lg font-bold text-[var(--color-text-main)]">Carteira Real</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[var(--color-navy-900)] p-4 rounded-xl border border-[var(--color-navy-800)]">
                            <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold mb-1">Patrimônio Atual</p>
                            <p className="text-xl font-bold font-mono text-[var(--color-text-main)]">{loading ? '...' : formatBRL(saldoTotalReal)}</p>
                            <p className={`text-xs mt-2 font-semibold ${pnlReal >= 0 ? 'text-[var(--color-profit-bright)]' : 'text-[var(--color-loss-bright)]'}`}>
                                {pnlReal >= 0 ? '+' : ''}{formatBRL(pnlReal)} P/L Real
                            </p>
                        </div>
                        <div className="bg-[var(--color-navy-900)] p-4 rounded-xl border border-[var(--color-navy-800)]">
                            <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold mb-1">Poder de Fogo</p>
                            <p className="text-xl font-bold text-[var(--color-brand-primary)]">{loading ? '...' : contratosReal} Alocados</p>
                            <p className="text-xs mt-2 text-[var(--color-text-muted)]">
                                Distribuídos em {contasReal.length} conta(s)
                            </p>
                        </div>
                    </div>
                </div>

                {/* BLOC: MESA PROPRIETÁRIA */}
                <div className="card border-l-4 border-l-[var(--color-warning)]">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[var(--color-navy-700)]">
                        <Building2 className="w-5 h-5 text-[var(--color-warning)]" />
                        <h2 className="text-lg font-bold text-[var(--color-text-main)]">Mesas Proprietárias (Prop Firms)</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[var(--color-navy-900)] p-4 rounded-xl border border-[var(--color-warning-dim)]">
                            <p className="text-xs text-[var(--color-warning)] uppercase font-bold mb-1">Saldo Líquido (P&L Pessoal)</p>
                            <p className="text-xl font-bold font-mono text-[var(--color-text-main)]">{loading ? '...' : formatBRL(pnlMesa)}</p>
                            <p className={`text-xs mt-2 font-semibold ${pnlMesa >= 0 ? 'text-[var(--color-profit-bright)]' : 'text-[var(--color-loss-bright)]'}`}>
                                Retirável ou Recente
                            </p>
                        </div>
                        <div className="bg-[var(--color-navy-900)] p-4 rounded-xl border border-[var(--color-navy-800)]">
                            <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold mb-1">Margem Base Liberada</p>
                            <p className="text-xl font-bold text-[var(--color-text-secondary)]">{loading ? '...' : formatBRL(margemMesa)}</p>
                            <p className="text-xs mt-2 text-[var(--color-text-muted)]">
                                Avaliações e Financiamento
                            </p>
                        </div>
                    </div>
                </div>
            </div>


            {/* Grid secundário */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Operações recentes */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-[var(--color-text-main)]">
                            Operações Recentes
                        </h2>
                        {operacoesRecentes.length > 0 && (
                            <span className="text-xs text-[var(--color-text-muted)]">Últimas 5</span>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-[var(--color-navy-700)] rounded animate-pulse" />)}
                        </div>
                    ) : operacoesRecentes.length === 0 ? (
                        <div className="text-center py-6">
                            <Activity className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" aria-hidden="true" />
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Nenhuma operação registrada. Lance sua primeira operação.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {operacoesRecentes.map(op => {
                                const profit = isProfit(op.resultado);
                                return (
                                    <div key={op.id} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded ${profit ? 'bg-[var(--color-profit-dim)]' : 'bg-[var(--color-loss-dim)]'}`}>
                                                {profit
                                                    ? <TrendingUp className="w-3 h-3 text-[var(--color-profit-bright)]" aria-hidden="true" />
                                                    : <TrendingDown className="w-3 h-3 text-[var(--color-loss-bright)]" aria-hidden="true" />
                                                }
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-[var(--color-text-main)]">{op.ativo}</p>
                                                <p className="text-xs text-[var(--color-text-muted)]">
                                                    {op.tipo} • {op.quantidade} contratos • {formatDate(op.data)}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontWeight: 700,
                                            color: profit ? 'var(--color-profit-bright)' : 'var(--color-loss-bright)'
                                        }}>
                                            {profit ? '+' : ''}{formatBRL(op.resultado)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Status das contas */}
                <div className="card">
                    <h2 className="text-base font-bold text-[var(--color-text-main)] mb-4">Status das Contas</h2>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => <div key={i} className="h-8 bg-[var(--color-navy-700)] rounded animate-pulse" />)}
                        </div>
                    ) : contas.length === 0 ? (
                        <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                            Nenhuma conta cadastrada.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {contas.map(c => {
                                const saldo = parseFloat(c.saldoAtual);
                                const meta = c.contaMesa ? parseFloat(c.contaMesa.meta) : null;
                                const progresso = meta ? Math.min(100, ((saldo - parseFloat(c.saldoInicial)) / meta) * 100) : null;

                                return (
                                    <div key={c.id} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-[var(--color-text-secondary)] truncate">
                                                {c.tipo === 'Real' ? c.contaReal?.corretora : c.descricao}
                                            </span>
                                            <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-main)' }}>
                                                {formatBRL(c.saldoAtual)}
                                            </span>
                                        </div>
                                        {progresso !== null && (
                                            <div className="h-1.5 bg-[var(--color-navy-700)] rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progresso)} aria-valuemin={0} aria-valuemax={100}>
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.max(0, progresso)}%`,
                                                        backgroundColor: progresso >= 100 ? 'var(--color-profit-bright)' : 'var(--color-brand)'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabela de contas */}
            {!loading && contas.length > 0 && (
                <div className="card p-0 overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--color-border)]">
                        <h2 className="text-base font-bold text-[var(--color-text-main)]">Resumo das Contas</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table aria-label="Resumo das contas">
                            <thead>
                                <tr>
                                    <th>Conta</th>
                                    <th>Patrimônio / Margem</th>
                                    <th className="text-center">Contratos</th>
                                    <th>Result. Líquido</th>
                                    <th>Result. Bruto</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contas.map(c => (
                                    <ContaRow 
                                        key={c.id} 
                                        conta={c} 
                                        ops={todasOperacoes.filter(op => op.contaId === c.id)} 
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}