// frontend/src/pages/Operacoes.tsx
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    TrendingUp, TrendingDown, Plus, AlertTriangle,
    CheckCircle, X, Activity, UploadCloud
} from 'lucide-react';
import { contasApi, operacoesApi, Conta, Operacao, formatBRL, formatDate, isProfit } from '../lib/api';
import { ImportCSVModal } from '../components/ImportCSVModal';

// ── Schema ────────────────────────────────────────────────────────────────

const operacaoSchema = z.object({
    contaId: z.string().min(1, 'Selecione uma conta'),
    ativo: z.string().min(1, 'Informe o ativo'),
    quantidade: z.preprocess(v => Number(v), z.number().int().positive('Quantidade deve ser um inteiro positivo')),
    precoEntrada: z.preprocess(v => Number(v), z.number().positive('Preço de entrada inválido')),
    precoSaida: z.preprocess(v => Number(v), z.number().positive('Preço de saída inválido')),
    tipo: z.enum(['Compra', 'Venda']),
    comissao: z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().min(0).optional()),
    observacoes: z.string().optional(),
    data: z.string().optional(),
});

type OperacaoForm = {
    contaId: string;
    ativo: string;
    quantidade: number;
    precoEntrada: number;
    precoSaida: number;
    tipo: 'Compra' | 'Venda';
    comissao?: number;
    observacoes?: string;
    data?: string;
};

// ── Resultado Preview ─────────────────────────────────────────────────────

function ResultadoPreview({ values }: { values: Partial<OperacaoForm> }) {
    const { precoEntrada, precoSaida, quantidade, comissao } = values;
    if (!precoEntrada || !precoSaida || !quantidade) return null;

    const diff = precoSaida - precoEntrada;
    const bruto = diff * quantidade;
    const resultado = bruto - (comissao || 0);
    const profit = resultado >= 0;

    return (
        <div className={`card-compact flex items-center justify-between ${profit ? 'border-[var(--color-profit-bright)]' : 'border-[var(--color-loss-bright)]'}`}
            style={{ borderColor: profit ? 'var(--color-profit-bright)' : 'var(--color-loss-bright)', borderWidth: '1px', borderStyle: 'solid' }}
            aria-live="polite"
        >
            <div className="flex items-center gap-2">
                {profit
                    ? <TrendingUp className="w-4 h-4 text-[var(--color-profit-bright)]" aria-hidden="true" />
                    : <TrendingDown className="w-4 h-4 text-[var(--color-loss-bright)]" aria-hidden="true" />
                }
                <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                    Resultado estimado
                </span>
            </div>
            <span
                className="font-bold text-lg"
                style={{ fontFamily: 'var(--font-mono)', color: profit ? 'var(--color-profit-bright)' : 'var(--color-loss-bright)' }}
            >
                {profit ? '+' : ''}{formatBRL(resultado)}
            </span>
        </div>
    );
}

// ── Tabela de Operações ───────────────────────────────────────────────────

function TabelaOperacoes({ operacoes, loading }: { operacoes: Operacao[]; loading: boolean }) {
    if (loading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-12 bg-[var(--color-navy-700)] rounded" />
                ))}
            </div>
        );
    }

    if (operacoes.length === 0) {
        return (
            <div className="card text-center py-10">
                <Activity className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" aria-hidden="true" />
                <p className="text-[var(--color-text-muted)]">Nenhuma operação encontrada.</p>
            </div>
        );
    }

    return (
        <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
                <table aria-label="Tabela de operações">
                    <thead>
                        <tr>
                            <th>Data/Hora</th>
                            <th>Conta</th>
                            <th>Ativo</th>
                            <th>Tipo</th>
                            <th>Contratos</th>
                            <th>Resultado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operacoes.map(op => {
                            const profit = isProfit(op.resultado);
                            const contaNome = op.conta?.descricao || op.conta?.tipo || 'Desconhecida';
                            
                            return (
                                <tr key={op.id}>
                                    <td className="text-[var(--color-text-muted)] whitespace-nowrap">
                                        {formatDate(op.data)}
                                    </td>
                                    <td className="text-[var(--color-text-secondary)]">{contaNome}</td>
                                    <td className="font-semibold text-[var(--color-text-main)]">{op.ativo}</td>
                                    <td>
                                        <span className={op.tipo === 'Compra' ? 'badge-success' : 'badge-danger'}>
                                            {op.tipo}
                                        </span>
                                    </td>
                                    <td className="text-[var(--color-text-secondary)]">{op.quantidade}</td>
                                    <td
                                        style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontWeight: 700,
                                            color: profit ? 'var(--color-profit-bright)' : 'var(--color-loss-bright)'
                                        }}
                                    >
                                        {profit ? '+' : ''}{formatBRL(op.resultado)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export function Operacoes() {
    const [contas, setContas] = useState<Conta[]>([]);
    const [operacoes, setOperacoes] = useState<Operacao[]>([]);
    const [loadingOps, setLoadingOps] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [filtroConta, setFiltroConta] = useState<string>('Todas');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<OperacaoForm>({
        resolver: zodResolver(operacaoSchema) as any,
        defaultValues: { tipo: 'Compra' },
    });

    const formValues = watch();

    const carregarContas = useCallback(async () => {
        const data = await contasApi.listar();
        setContas(data);
    }, []);

    const carregarOperacoes = useCallback(async () => {
        setLoadingOps(true);
        try {
            const data = await operacoesApi.listar();
            setOperacoes(data);
        } finally {
            setLoadingOps(false);
        }
    }, []);

    useEffect(() => {
        carregarContas();
        carregarOperacoes();
    }, [carregarContas, carregarOperacoes]);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const onSubmit = async (data: OperacaoForm) => {
        try {
            const op = await operacoesApi.lancar({
                ...data,
                data: data.data || undefined,
            });
            setOperacoes(prev => [op, ...prev]);

            // Atualiza saldo da conta localmente
            setContas(prev => prev.map(c => c.id === data.contaId
                ? { ...c, saldoAtual: String(parseFloat(c.saldoAtual) + parseFloat(op.resultado)) }
                : c
            ));

            reset();
            setShowForm(false);
            showToast('Operação lançada com sucesso!', 'success');
        } catch (err: any) {
            showToast(err?.response?.data?.error || 'Erro ao lançar operação.', 'error');
        }
    };

    const opsFiltradas = filtroConta === 'Todas' ? operacoes : operacoes.filter(op => op.contaId === filtroConta);

    // Métricas
    const qtdTotal = opsFiltradas.length;
    const qtdGains = opsFiltradas.filter(op => isProfit(op.resultado)).length;
    const winRate = qtdTotal > 0 ? (qtdGains / qtdTotal) * 100 : 0;
    
    const taxasB3 = opsFiltradas.reduce((acc, op) => acc + parseFloat(op.comissao || '0'), 0);
    const totalLiquido = opsFiltradas.reduce((acc, op) => acc + parseFloat(op.resultado), 0);
    const totalBruto = totalLiquido + taxasB3;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm shadow-lg border ${
                        toast.type === 'success'
                            ? 'bg-[var(--color-success-dim)] border-[var(--color-success)] text-[var(--color-success)]'
                            : 'bg-[var(--color-danger-dim)] border-[var(--color-danger)] text-[var(--color-danger)]'
                    }`}
                    role="status"
                    aria-live="polite"
                >
                    {toast.type === 'success'
                        ? <CheckCircle className="w-4 h-4" aria-hidden="true" />
                        : <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    }
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-[var(--color-navy-800)] p-6 rounded-xl border border-[var(--color-navy-700)] shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Extrato de Operações</h1>
                    <p className="text-[var(--color-text-muted)] text-sm mt-1">
                        Acompanhe seu histórico tático e resultados isolados por conta.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        className="input-field max-w-[200px]"
                        value={filtroConta}
                        onChange={(e) => setFiltroConta(e.target.value)}
                    >
                        <option value="Todas">Todas as Contas</option>
                        {contas.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.tipo === 'Real' ? `${c.contaReal?.corretora} (Real)` : `${c.descricao || 'Mesa Props'}`}
                            </option>
                        ))}
                    </select>

                    <button
                        id="btn-importar-csv"
                        onClick={() => setShowImport(true)}
                        className="btn-secondary whitespace-nowrap"
                    >
                        <UploadCloud className="w-4 h-4" aria-hidden="true" />
                        CSV Profit
                    </button>
                    <button
                        id="btn-lancar-operacao"
                        onClick={() => setShowForm(v => !v)}
                        className={showForm ? 'btn-secondary' : 'btn-primary'}
                    >
                        {showForm ? 'Cancelar Lançamento' : 'Nova Operação'}
                    </button>
                </div>
            </div>

            {/* Mini Dashboard de Performance da Conta */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-[var(--color-navy-900)] p-4 rounded-xl border border-[var(--color-navy-800)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold mb-1">Resultado Líquido</p>
                    <p style={{ fontFamily: 'var(--font-mono)' }} className={`text-lg font-bold ${totalLiquido >= 0 ? 'text-[var(--color-profit-bright)]' : 'text-[var(--color-loss-bright)]'}`}>
                        {totalLiquido >= 0 ? '+' : ''}{formatBRL(totalLiquido)}
                    </p>
                </div>
                <div className="bg-[var(--color-navy-900)] p-4 rounded-xl border border-[var(--color-navy-800)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold mb-1">Resultado Bruto</p>
                    <p style={{ fontFamily: 'var(--font-mono)' }} className={`text-lg font-bold ${totalBruto >= 0 ? 'text-[var(--color-profit-bright)]' : 'text-[var(--color-loss-bright)]'}`}>
                        {totalBruto >= 0 ? '+' : ''}{formatBRL(totalBruto)}
                    </p>
                </div>
                <div className="bg-[var(--color-navy-900)] p-4 rounded-xl border border-[var(--color-navy-800)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold mb-1">Custos Totais (B3)</p>
                    <p style={{ fontFamily: 'var(--font-mono)' }} className="text-lg font-bold text-[var(--color-danger)]">
                        {formatBRL(-taxasB3)}
                    </p>
                </div>
                <div className="bg-[var(--color-navy-900)] p-4 rounded-xl border border-[var(--color-navy-800)]">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold mb-1">Taxa de Acertos</p>
                    <p className="text-lg font-bold text-[var(--color-text-main)]">
                        {winRate.toFixed(1)}% <span className="text-xs font-normal text-[var(--color-text-muted)]">({qtdTotal} trades)</span>
                    </p>
                </div>
            </div>


            <ImportCSVModal
                isOpen={showImport}
                onClose={() => setShowImport(false)}
                contas={contas}
                onSuccess={() => {
                    setShowImport(false);
                    showToast('Arquivo importado com sucesso!', 'success');
                    carregarContas();
                    carregarOperacoes();
                }}
            />

            {/* Formulário inline */}
            {showForm && (
                <div className="card">
                    <h2 className="text-base font-bold text-[var(--color-text-main)] mb-5">Nova Operação</h2>

                    {contas.length === 0 && (
                        <div className="mb-4 p-3 rounded border border-[var(--color-warning)] bg-[var(--color-warning-dim)] flex items-center gap-2" role="alert">
                            <AlertTriangle className="w-4 h-4 text-[var(--color-warning)] shrink-0" aria-hidden="true" />
                            <p className="text-sm text-[var(--color-warning)]">
                                Nenhuma conta cadastrada. Crie uma conta antes de lançar operações.
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                        {/* Conta + Ativo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="conta-select" className="form-label">Conta *</label>
                                <select id="conta-select" {...register('contaId')} className="form-select">
                                    <option value="">Selecione uma conta…</option>
                                    {contas.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.tipo === 'Real' ? c.contaReal?.corretora : c.descricao}
                                            {' '}({c.tipo === 'Real' ? 'Real' : 'Mesa'})
                                        </option>
                                    ))}
                                </select>
                                {errors.contaId && <p className="form-error">{errors.contaId.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="ativo" className="form-label">Ativo *</label>
                                <input
                                    id="ativo"
                                    {...register('ativo')}
                                    className="form-input"
                                    placeholder="Ex.: WINJ26, PETR4, BTC/USD…"
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                                {errors.ativo && <p className="form-error">{errors.ativo.message}</p>}
                            </div>
                        </div>

                        {/* Tipo + Quantidade */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="tipo-op" className="form-label">Tipo *</label>
                                <select id="tipo-op" {...register('tipo')} className="form-select">
                                    <option value="Compra">Compra</option>
                                    <option value="Venda">Venda</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="quantidade" className="form-label">Quantidade *</label>
                                <input
                                    id="quantidade"
                                    type="number"
                                    min="1"
                                    step="1"
                                    {...register('quantidade')}
                                    className="form-input"
                                    placeholder="1"
                                    inputMode="numeric"
                                />
                                {errors.quantidade && <p className="form-error">{errors.quantidade.message}</p>}
                            </div>
                        </div>

                        {/* Preços */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="precoEntrada" className="form-label">Preço de Entrada *</label>
                                <input
                                    id="precoEntrada"
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    {...register('precoEntrada')}
                                    className="form-input"
                                    placeholder="120000.00"
                                    inputMode="decimal"
                                />
                                {errors.precoEntrada && <p className="form-error">{errors.precoEntrada.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="precoSaida" className="form-label">Preço de Saída *</label>
                                <input
                                    id="precoSaida"
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    {...register('precoSaida')}
                                    className="form-input"
                                    placeholder="120500.00"
                                    inputMode="decimal"
                                />
                                {errors.precoSaida && <p className="form-error">{errors.precoSaida.message}</p>}
                            </div>
                        </div>

                        {/* Comissão + Data */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="comissao" className="form-label">Comissão (R$)</label>
                                <input
                                    id="comissao"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...register('comissao')}
                                    className="form-input"
                                    placeholder="0.00"
                                    inputMode="decimal"
                                />
                            </div>
                            <div>
                                <label htmlFor="dataOp" className="form-label">Data/Hora</label>
                                <input
                                    id="dataOp"
                                    type="datetime-local"
                                    {...register('data')}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        {/* Observações */}
                        <div>
                            <label htmlFor="observacoes" className="form-label">Observações</label>
                            <input
                                id="observacoes"
                                {...register('observacoes')}
                                className="form-input"
                                placeholder="Opcional…"
                                autoComplete="off"
                            />
                        </div>

                        {/* Preview do resultado */}
                        <ResultadoPreview values={formValues} />

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => { reset(); setShowForm(false); }} className="btn-secondary">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isSubmitting || contas.length === 0} className="btn-primary flex-1">
                                {isSubmitting ? 'Lançando…' : 'Confirmar Operação'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabela */}
            <TabelaOperacoes operacoes={opsFiltradas} loading={loadingOps} />
        </div>
    );
}