// frontend/src/pages/Contas.tsx
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Plus, Wallet, Building2, RefreshCw,
    X, ChevronRight, AlertTriangle, CheckCircle
} from 'lucide-react';
import { contasApi, Conta, formatBRL } from '../lib/api';

// ── Schemas ──────────────────────────────────────────────────────────────

const contaRealSchema = z.object({
    corretora: z.string().min(1, 'Informe a corretora'),
    tipoOperacao: z.enum(['B3', 'Internacional']),
    moeda: z.enum(['BRL', 'USD']),
    saldoInicial: z.preprocess(v => Number(v), z.number().positive('Saldo deve ser positivo')),
    descricao: z.string().optional(),
    rollbackAtivo: z.boolean().optional(),
    regraContratosBase: z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().positive().optional()),
});

const contaMesaSchema = z.object({
    descricao: z.string().min(1, 'Informe o nome da conta'),
    tipoMesa: z.enum(['Avaliacao', 'Incubadora', 'Patrocinada']),
    meta: z.preprocess(v => Number(v), z.number().positive('Meta deve ser positiva')),
    saldoInicial: z.preprocess(v => Number(v), z.number().positive('Saldo deve ser positivo')),
    perdaDiariaMaxima: z.preprocess(v => Number(v), z.number().positive('Perda diária deve ser positiva')),
    eliminaNaPerda: z.boolean().optional(),
    dataInicio: z.string().min(1, 'Informe a data de início'),
    dataFim: z.string().optional(),
});

type ContaRealForm = {
    corretora: string;
    tipoOperacao: 'B3' | 'Internacional';
    moeda: 'BRL' | 'USD';
    saldoInicial: number;
    descricao?: string;
    rollbackAtivo?: boolean;
    regraContratosBase?: number;
};

type ContaMesaForm = {
    descricao: string;
    tipoMesa: 'Avaliacao' | 'Incubadora' | 'Patrocinada';
    meta: number;
    saldoInicial: number;
    perdaDiariaMaxima: number;
    eliminaNaPerda?: boolean;
    dataInicio: string;
    dataFim?: string;
};

// ── Subcomponents ─────────────────────────────────────────────────────────

function ContaCard({ conta, onClick }: { conta: Conta; onClick: () => void }) {
    const saldo = parseFloat(conta.saldoAtual);
    const inicial = parseFloat(conta.saldoInicial);
    const pnl = saldo - inicial;
    const isReal = conta.tipo === 'Real';

    return (
        <button
            onClick={onClick}
            className="card w-full text-left hover:border-[var(--color-brand)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            aria-label={`Ver detalhes da conta ${conta.descricao || conta.contaReal?.corretora || conta.contaMesa?.tipo}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded ${isReal ? 'bg-[var(--color-brand-dim)]' : 'bg-[var(--color-warning-dim)]'}`}>
                        {isReal
                            ? <Wallet className="w-4 h-4 text-[var(--color-brand)]" aria-hidden="true" />
                            : <Building2 className="w-4 h-4 text-[var(--color-warning)]" aria-hidden="true" />
                        }
                    </div>
                    <div>
                        <p className="font-semibold text-[var(--color-text-main)] text-sm">
                            {isReal ? conta.contaReal?.corretora : conta.descricao}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            {isReal
                                ? `${conta.contaReal?.tipoOperacao} • ${conta.contaReal?.moeda}`
                                : conta.contaMesa?.tipo
                            }
                        </p>
                    </div>
                </div>
                <span className={conta.status === 'Ativa' ? 'badge-success' : 'badge-warning'}>
                    {conta.status}
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-[var(--color-text-muted)]">Saldo Atual</span>
                    <span className="font-bold text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatBRL(conta.saldoAtual)}
                    </span>
                </div>
                {isReal && (
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--color-text-muted)]">Contratos</span>
                        <span className="font-bold text-[var(--color-brand)]">
                            {conta.contaReal?.contratosAtuais}
                        </span>
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <span className="text-xs text-[var(--color-text-muted)]">P&L Total</span>
                    <span
                        className="font-semibold text-sm"
                        style={{
                            color: pnl >= 0 ? 'var(--color-profit-bright)' : 'var(--color-loss-bright)',
                            fontFamily: 'var(--font-mono)'
                        }}
                    >
                        {pnl >= 0 ? '+' : ''}{formatBRL(pnl)}
                    </span>
                </div>
            </div>

            {conta.rollbackAtivo && isReal && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 text-[var(--color-warning)]" aria-hidden="true" />
                    <span className="text-xs text-[var(--color-text-muted)]">Rollback ativo</span>
                </div>
            )}
            <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] mt-2 ml-auto" aria-hidden="true" />
        </button>
    );
}

function ModalCriarReal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (c: Conta) => void }) {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ContaRealForm>({
        resolver: zodResolver(contaRealSchema) as any,
        defaultValues: { tipoOperacao: 'B3', moeda: 'BRL', rollbackAtivo: true },
    });

    const tipoOp = watch('tipoOperacao');

    const onSubmit = async (data: ContaRealForm) => {
        const conta = await contasApi.criarReal(data);
        onSuccess(conta);
    };

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Criar Conta Real">
            <div className="modal-box">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-[var(--color-text-main)]">Nova Conta Real</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-[var(--color-navy-700)] text-[var(--color-text-muted)]" aria-label="Fechar modal">
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                    <div>
                        <label htmlFor="corretora" className="form-label">Corretora *</label>
                        <input id="corretora" {...register('corretora')} className="form-input" placeholder="Ex.: XP Investimentos…" autoComplete="off" />
                        {errors.corretora && <p className="form-error">{errors.corretora.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="tipoOperacao" className="form-label">Tipo de Operação *</label>
                            <select id="tipoOperacao" {...register('tipoOperacao')} className="form-select">
                                <option value="B3">Nacional (B3)</option>
                                <option value="Internacional">Internacional</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="moeda" className="form-label">Moeda *</label>
                            <select id="moeda" {...register('moeda')} className="form-select" disabled={tipoOp === 'B3'}>
                                <option value="BRL">BRL</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="saldoInicial" className="form-label">Saldo Inicial (R$) *</label>
                        <input id="saldoInicial" type="number" step="0.01" min="0.01" {...register('saldoInicial')} className="form-input" placeholder="10000.00" inputMode="decimal" />
                        {errors.saldoInicial && <p className="form-error">{errors.saldoInicial.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="regraContratosBase" className="form-label">Base por Contrato (R$)</label>
                        <input id="regraContratosBase" type="number" step="0.01" {...register('regraContratosBase')} className="form-input" placeholder="1000.00 (padrão)" inputMode="decimal" />
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">1 contrato a cada R$ 1.000 de saldo (padrão)</p>
                    </div>

                    <div>
                        <label htmlFor="descricao" className="form-label">Descrição</label>
                        <input id="descricao" {...register('descricao')} className="form-input" placeholder="Opcional…" autoComplete="off" />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" {...register('rollbackAtivo')} className="w-4 h-4 accent-[var(--color-brand)]" />
                        <span className="text-sm text-[var(--color-text-secondary)]">Ativar rollback automático de contratos</span>
                    </label>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Criando…' : 'Criar Conta Real'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ModalCriarMesa({ onClose, onSuccess }: { onClose: () => void; onSuccess: (c: Conta) => void }) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContaMesaForm>({
        resolver: zodResolver(contaMesaSchema) as any,
        defaultValues: { tipoMesa: 'Avaliacao', eliminaNaPerda: true },
    });

    const onSubmit = async (data: ContaMesaForm) => {
        const conta = await contasApi.criarMesa(data);
        onSuccess(conta);
    };

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Criar Conta Mesa Proprietária">
            <div className="modal-box">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-[var(--color-text-main)]">Nova Conta Mesa Proprietária</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-[var(--color-navy-700)] text-[var(--color-text-muted)]" aria-label="Fechar modal">
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                    <div>
                        <label htmlFor="mesa-descricao" className="form-label">Nome da Conta *</label>
                        <input id="mesa-descricao" {...register('descricao')} className="form-input" placeholder="Ex.: FTMO Challenge…" autoComplete="off" />
                        {errors.descricao && <p className="form-error">{errors.descricao.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="tipoMesa" className="form-label">Tipo de Conta *</label>
                        <select id="tipoMesa" {...register('tipoMesa')} className="form-select">
                            <option value="Avaliacao">Avaliação</option>
                            <option value="Incubadora">Incubadora</option>
                            <option value="Patrocinada">Patrocinada</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="mesa-saldo" className="form-label">Saldo Inicial (R$) *</label>
                            <input id="mesa-saldo" type="number" step="0.01" min="0.01" {...register('saldoInicial')} className="form-input" placeholder="100000.00" inputMode="decimal" />
                            {errors.saldoInicial && <p className="form-error">{errors.saldoInicial.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="mesa-meta" className="form-label">Meta (R$) *</label>
                            <input id="mesa-meta" type="number" step="0.01" min="0.01" {...register('meta')} className="form-input" placeholder="10000.00" inputMode="decimal" />
                            {errors.meta && <p className="form-error">{errors.meta.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="perdaDiaria" className="form-label">Perda Diária Máxima (R$) *</label>
                        <input id="perdaDiaria" type="number" step="0.01" min="0.01" {...register('perdaDiariaMaxima')} className="form-input" placeholder="2000.00" inputMode="decimal" />
                        {errors.perdaDiariaMaxima && <p className="form-error">{errors.perdaDiariaMaxima.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="dataInicio" className="form-label">Data de Início *</label>
                            <input id="dataInicio" type="date" {...register('dataInicio')} className="form-input" />
                            {errors.dataInicio && <p className="form-error">{errors.dataInicio.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="dataFim" className="form-label">Data de Fim</label>
                            <input id="dataFim" type="date" {...register('dataFim')} className="form-input" />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" {...register('eliminaNaPerda')} className="w-4 h-4 accent-[var(--color-brand)]" />
                        <span className="text-sm text-[var(--color-text-secondary)]">Eliminar da prova ao atingir a perda diária</span>
                    </label>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Criando…' : 'Criar Conta Mesa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────

type Modal = 'real' | 'mesa' | null;

export function Contas() {
    const [contas, setContas] = useState<Conta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<Modal>(null);
    const [toast, setToast] = useState<string | null>(null);

    const carregar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await contasApi.listar();
            setContas(data);
        } catch {
            setError('Não foi possível carregar as contas. Verifique se o backend está rodando.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const handleSuccess = (nova: Conta) => {
        setContas(prev => [nova, ...prev]);
        setModal(null);
        setToast('Conta criada com sucesso!');
        setTimeout(() => setToast(null), 3500);
    };

    const contsReais = contas.filter(c => c.tipo === 'Real');
    const contsMesa = contas.filter(c => c.tipo === 'MesaProprietaria');

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 bg-[var(--color-success-dim)] border border-[var(--color-success)] text-[var(--color-success)] px-4 py-3 rounded-lg font-semibold text-sm shadow-lg" role="status" aria-live="polite">
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    {toast}
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Gestão de Contas</h1>
                    <p className="text-[var(--color-text-muted)] text-sm mt-1">
                        {contas.length} {contas.length === 1 ? 'conta cadastrada' : 'contas cadastradas'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setModal('real')} className="btn-primary" id="btn-nova-real">
                        <Plus className="w-4 h-4" aria-hidden="true" /> Conta Real
                    </button>
                    <button onClick={() => setModal('mesa')} className="btn-secondary" id="btn-nova-mesa">
                        <Plus className="w-4 h-4" aria-hidden="true" /> Mesa
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="card border-[var(--color-danger)] flex items-center gap-3" role="alert">
                    <AlertTriangle className="w-5 h-5 text-[var(--color-danger)] shrink-0" aria-hidden="true" />
                    <p className="text-sm text-[var(--color-danger)]">{error}</p>
                    <button onClick={carregar} className="ml-auto btn-secondary text-xs py-1">Tentar novamente</button>
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card animate-pulse">
                            <div className="h-4 bg-[var(--color-navy-700)] rounded w-2/3 mb-3" />
                            <div className="h-3 bg-[var(--color-navy-700)] rounded w-1/2 mb-4" />
                            <div className="h-6 bg-[var(--color-navy-700)] rounded w-full" />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && contas.length === 0 && (
                <div className="card text-center py-12">
                    <Wallet className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-[var(--color-text-main)] mb-2">Nenhuma conta cadastrada</h3>
                    <p className="text-[var(--color-text-muted)] text-sm mb-5">
                        Comece criando sua primeira conta Real ou Mesa Proprietária.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setModal('real')} className="btn-primary">
                            <Plus className="w-4 h-4" aria-hidden="true" /> Conta Real
                        </button>
                        <button onClick={() => setModal('mesa')} className="btn-secondary">
                            <Plus className="w-4 h-4" aria-hidden="true" /> Mesa Proprietária
                        </button>
                    </div>
                </div>
            )}

            {/* Contas Reais */}
            {!loading && contsReais.length > 0 && (
                <section aria-labelledby="secao-real">
                    <div className="flex items-center gap-2 mb-3">
                        <Wallet className="w-4 h-4 text-[var(--color-brand)]" aria-hidden="true" />
                        <h2 id="secao-real" className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Contas Reais ({contsReais.length})
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contsReais.map(c => (
                            <ContaCard key={c.id} conta={c} onClick={() => {}} />
                        ))}
                    </div>
                </section>
            )}

            {/* Mesa Proprietária */}
            {!loading && contsMesa.length > 0 && (
                <section aria-labelledby="secao-mesa">
                    <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-[var(--color-warning)]" aria-hidden="true" />
                        <h2 id="secao-mesa" className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Mesa Proprietária ({contsMesa.length})
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contsMesa.map(c => (
                            <ContaCard key={c.id} conta={c} onClick={() => {}} />
                        ))}
                    </div>
                </section>
            )}

            {/* Modais */}
            {modal === 'real' && <ModalCriarReal onClose={() => setModal(null)} onSuccess={handleSuccess} />}
            {modal === 'mesa' && <ModalCriarMesa onClose={() => setModal(null)} onSuccess={handleSuccess} />}
        </div>
    );
}