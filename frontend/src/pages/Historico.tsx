// frontend/src/pages/Historico.tsx
import { useState, useEffect, useCallback } from 'react';
import { contasApi, Conta, Operacao, formatBRL, formatDate, isProfit } from '../lib/api';
import { History, TrendingUp, TrendingDown, Filter, X } from 'lucide-react';

// ── Filtros ───────────────────────────────────────────────────────────────

interface Filtros {
    contaId: string;
    ativo: string;
    resultado: '' | 'Lucro' | 'Prejuizo';
    dataInicio: string;
    dataFim: string;
}

const defaultFiltros: Filtros = {
    contaId: '',
    ativo: '',
    resultado: '',
    dataInicio: '',
    dataFim: '',
};

// ── Main Page ─────────────────────────────────────────────────────────────

export function Historico() {
    const [contas, setContas] = useState<Conta[]>([]);
    const [operacoes, setOperacoes] = useState<Operacao[]>([]);
    const [loading, setLoading] = useState(false);
    const [filtros, setFiltros] = useState<Filtros>(defaultFiltros);
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    const carregarContas = useCallback(async () => {
        const data = await contasApi.listar();
        setContas(data);
    }, []);

    const buscar = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (filtros.ativo) params['ativo'] = filtros.ativo;
            if (filtros.resultado) params['resultado'] = filtros.resultado;
            if (filtros.dataInicio) params['dataInicio'] = new Date(filtros.dataInicio).toISOString();
            if (filtros.dataFim) params['dataFim'] = new Date(filtros.dataFim).toISOString();

            let ops: Operacao[];
            if (filtros.contaId) {
                ops = await contasApi.listarOperacoes(filtros.contaId, params);
            } else {
                const { operacoesApi } = await import('../lib/api');
                ops = await operacoesApi.listar(params);
            }
            setOperacoes(ops);
        } finally {
            setLoading(false);
        }
    }, [filtros]);

    useEffect(() => { carregarContas(); }, [carregarContas]);
    useEffect(() => { buscar(); }, [buscar]);

    const limparFiltros = () => setFiltros(defaultFiltros);
    const filtrosAtivos = Object.values(filtros).some(v => v !== '');

    const totalLucro = operacoes.reduce((acc, op) => {
        const r = parseFloat(op.resultado);
        return r > 0 ? acc + r : acc;
    }, 0);
    const totalPrejuizo = operacoes.reduce((acc, op) => {
        const r = parseFloat(op.resultado);
        return r < 0 ? acc + r : acc;
    }, 0);
    const pnlTotal = operacoes.reduce((acc, op) => acc + parseFloat(op.resultado), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Histórico de Operações</h1>
                    <p className="text-[var(--color-text-muted)] text-sm mt-1">
                        {operacoes.length} {operacoes.length === 1 ? 'operação encontrada' : 'operações encontradas'}
                    </p>
                </div>
                <button
                    onClick={() => setMostrarFiltros(v => !v)}
                    className={mostrarFiltros ? 'btn-secondary' : 'btn-secondary'}
                    aria-expanded={mostrarFiltros}
                    aria-controls="painel-filtros"
                >
                    {filtrosAtivos && !mostrarFiltros
                        ? <><Filter className="w-4 h-4 text-[var(--color-brand)]" aria-hidden="true" /> Filtros ativos</>
                        : <><Filter className="w-4 h-4" aria-hidden="true" /> Filtros</>
                    }
                </button>
            </div>

            {/* Painel de filtros */}
            {mostrarFiltros && (
                <div id="painel-filtros" className="card space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Filtros</h2>
                        {filtrosAtivos && (
                            <button onClick={limparFiltros} className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
                                <X className="w-3 h-3" aria-hidden="true" /> Limpar
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="filtro-conta" className="form-label">Conta</label>
                            <select
                                id="filtro-conta"
                                className="form-select"
                                value={filtros.contaId}
                                onChange={e => setFiltros(f => ({ ...f, contaId: e.target.value }))}
                            >
                                <option value="">Todas as contas</option>
                                {contas.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.tipo === 'Real' ? c.contaReal?.corretora : c.descricao}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filtro-ativo" className="form-label">Ativo</label>
                            <input
                                id="filtro-ativo"
                                className="form-input"
                                placeholder="Ex.: WINJ26…"
                                value={filtros.ativo}
                                onChange={e => setFiltros(f => ({ ...f, ativo: e.target.value }))}
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                        <div>
                            <label htmlFor="filtro-resultado" className="form-label">Resultado</label>
                            <select
                                id="filtro-resultado"
                                className="form-select"
                                value={filtros.resultado}
                                onChange={e => setFiltros(f => ({ ...f, resultado: e.target.value as Filtros['resultado'] }))}
                            >
                                <option value="">Todos</option>
                                <option value="Lucro">Lucro</option>
                                <option value="Prejuizo">Prejuízo</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filtro-inicio" className="form-label">Data Início</label>
                            <input
                                id="filtro-inicio"
                                type="date"
                                className="form-input"
                                value={filtros.dataInicio}
                                onChange={e => setFiltros(f => ({ ...f, dataInicio: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label htmlFor="filtro-fim" className="form-label">Data Fim</label>
                            <input
                                id="filtro-fim"
                                type="date"
                                className="form-input"
                                value={filtros.dataFim}
                                onChange={e => setFiltros(f => ({ ...f, dataFim: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Resumo KPIs */}
            {operacoes.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="card-compact">
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold mb-1">P&L Total</p>
                        <p
                            className="text-xl font-bold"
                            style={{ fontFamily: 'var(--font-mono)', color: pnlTotal >= 0 ? 'var(--color-profit-bright)' : 'var(--color-loss-bright)' }}
                        >
                            {pnlTotal >= 0 ? '+' : ''}{formatBRL(pnlTotal)}
                        </p>
                    </div>
                    <div className="card-compact">
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold mb-1">Total Lucros</p>
                        <p className="text-xl font-bold text-[var(--color-profit-bright)]" style={{ fontFamily: 'var(--font-mono)' }}>
                            +{formatBRL(totalLucro)}
                        </p>
                    </div>
                    <div className="card-compact">
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold mb-1">Total Prejuízos</p>
                        <p className="text-xl font-bold text-[var(--color-loss-bright)]" style={{ fontFamily: 'var(--font-mono)' }}>
                            {formatBRL(totalPrejuizo)}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabela */}
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse h-12 bg-[var(--color-navy-700)] rounded" />
                    ))}
                </div>
            ) : operacoes.length === 0 ? (
                <div className="card text-center py-12">
                    <History className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-[var(--color-text-main)] mb-2">Nenhuma operação encontrada</h3>
                    <p className="text-[var(--color-text-muted)] text-sm">
                        {filtrosAtivos
                            ? 'Tente ajustar os filtros de busca.'
                            : 'Lance sua primeira operação na seção de Operações.'}
                    </p>
                    {filtrosAtivos && (
                        <button onClick={limparFiltros} className="btn-secondary mt-4">Limpar filtros</button>
                    )}
                </div>
            ) : (
                <div className="card p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table aria-label="Histórico de operações">
                            <thead>
                                <tr>
                                    <th>Data/Hora</th>
                                    <th>Ativo</th>
                                    <th>Tipo</th>
                                    <th>Qtd</th>
                                    <th>Entrada</th>
                                    <th>Saída</th>
                                    <th>Comissão</th>
                                    <th>Resultado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {operacoes.map(op => {
                                    const profit = isProfit(op.resultado);
                                    return (
                                        <tr key={op.id}>
                                            <td className="text-[var(--color-text-muted)] whitespace-nowrap text-xs">
                                                {formatDate(op.data)}
                                            </td>
                                            <td className="font-semibold text-[var(--color-text-main)]">
                                                {op.ativo}
                                                {op.observacoes && (
                                                    <span className="block text-xs text-[var(--color-text-muted)] font-normal truncate max-w-[140px]">
                                                        {op.observacoes}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={op.tipo === 'Compra' ? 'badge-success' : 'badge-danger'}>
                                                    {op.tipo}
                                                </span>
                                            </td>
                                            <td className="text-[var(--color-text-secondary)]">{op.quantidade}</td>
                                            <td style={{ fontFamily: 'var(--font-mono)' }} className="text-[var(--color-text-secondary)]">
                                                {formatBRL(op.precoEntrada)}
                                            </td>
                                            <td style={{ fontFamily: 'var(--font-mono)' }} className="text-[var(--color-text-secondary)]">
                                                {formatBRL(op.precoSaida)}
                                            </td>
                                            <td style={{ fontFamily: 'var(--font-mono)' }} className="text-[var(--color-text-muted)]">
                                                {formatBRL(op.comissao)}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    {profit
                                                        ? <TrendingUp className="w-3 h-3 text-[var(--color-profit-bright)]" aria-hidden="true" />
                                                        : <TrendingDown className="w-3 h-3 text-[var(--color-loss-bright)]" aria-hidden="true" />
                                                    }
                                                    <span style={{
                                                        fontFamily: 'var(--font-mono)',
                                                        fontWeight: 700,
                                                        color: profit ? 'var(--color-profit-bright)' : 'var(--color-loss-bright)'
                                                    }}>
                                                        {profit ? '+' : ''}{formatBRL(op.resultado)}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}