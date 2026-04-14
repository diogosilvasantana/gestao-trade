// frontend/src/lib/api.ts
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: { 'Content-Type': 'application/json' },
});

// ── Types ──────────────────────────────────────────────────────────────────

export interface ContaReal {
    id: string;
    corretora: string;
    tipoOperacao: 'B3' | 'Internacional';
    moeda: 'BRL' | 'USD';
    contratosAtuais: number;
    regraContratosBase: string;
}

export interface ContaMesa {
    id: string;
    tipo: 'Avaliacao' | 'Incubadora' | 'Patrocinada';
    meta: string;
    perdaDiariaMaxima: string;
    eliminaNaPerda: boolean;
    dataInicio: string;
    dataFim?: string;
    statusAprovacao: string;
}

export interface Conta {
    id: string;
    tipo: 'Real' | 'MesaProprietaria';
    descricao?: string;
    status: string;
    saldoInicial: string;
    saldoAtual: string;
    rollbackAtivo: boolean;
    createdAt: string;
    updatedAt: string;
    contaReal?: ContaReal;
    contaMesa?: ContaMesa;
}

export interface Operacao {
    id: string;
    contaId: string;
    data: string;
    ativo: string;
    quantidade: number;
    precoEntrada: string;
    precoSaida: string;
    tipo: 'Compra' | 'Venda';
    comissao: string;
    resultado: string;
    observacoes?: string;
    status: string;
    conta?: { tipo: string; descricao?: string };
}

export interface HistoricoSaldo {
    id: string;
    contaId: string;
    data: string;
    saldoAnterior: string;
    saldoNovo: string;
    tipoMovimento: string;
    contratosAnteriores?: number;
    contratosNovos?: number;
    houveRollback: boolean;
    motivoRollback?: string;
}

// ── Contas ─────────────────────────────────────────────────────────────────

export const contasApi = {
    listar: () => api.get<Conta[]>('/contas').then(r => r.data),

    buscarPorId: (id: string) => api.get<Conta>(`/contas/${id}`).then(r => r.data),

    criarReal: (data: {
        corretora: string;
        tipoOperacao: 'B3' | 'Internacional';
        moeda: 'BRL' | 'USD';
        saldoInicial: number;
        descricao?: string;
        rollbackAtivo?: boolean;
        regraContratosBase?: number;
    }) => api.post<Conta>('/contas/real', data).then(r => r.data),

    criarMesa: (data: {
        tipoMesa: 'Avaliacao' | 'Incubadora' | 'Patrocinada';
        meta: number;
        saldoInicial: number;
        perdaDiariaMaxima: number;
        dataInicio: string;
        descricao?: string;
        eliminaNaPerda?: boolean;
        dataFim?: string;
        rollbackAtivo?: boolean;
    }) => api.post<Conta>('/contas/mesa', data).then(r => r.data),

    editar: (id: string, data: Record<string, unknown>) =>
        api.patch<Conta>(`/contas/${id}`, data).then(r => r.data),

    listarOperacoes: (id: string, filtros?: Record<string, string>) =>
        api.get<Operacao[]>(`/contas/${id}/operacoes`, { params: filtros }).then(r => r.data),

    listarHistorico: (id: string) =>
        api.get<HistoricoSaldo[]>(`/contas/${id}/historico`).then(r => r.data),
};

// ── Operações ──────────────────────────────────────────────────────────────

export const operacoesApi = {
    listar: (filtros?: Record<string, string>) =>
        api.get<Operacao[]>('/operacoes', { params: filtros }).then(r => r.data),

    lancar: (data: {
        contaId: string;
        ativo: string;
        quantidade: number;
        precoEntrada: number;
        precoSaida: number;
        tipo: 'Compra' | 'Venda';
        comissao?: number;
        observacoes?: string;
        data?: string;
    }) => api.post<Operacao>('/operacoes', data).then(r => r.data),

    importarLote: (data: {
        contaId: string;
        operacoes: Array<{
            data?: string;
            ativo: string;
            quantidade: number;
            precoEntrada: number;
            precoSaida: number;
            tipo: 'Compra' | 'Venda';
            resultado: number;
        }>;
    }) => api.post<{ msg: string }>('/operacoes/lote', data).then(r => r.data),
};

export const taxasApi = {
    listar: () => api.get<any[]>('/taxas').then(r => r.data),
    atualizar: (id: string, valor: number) => api.patch<any>(`/taxas/${id}`, { valor }).then(r => r.data),
};

// ── Helpers ────────────────────────────────────────────────────────────────

export function formatBRL(value: string | number): string {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(new Date(iso));
}

export function formatDateOnly(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(iso));
}

export function isProfit(resultado: string | number): boolean {
    return parseFloat(String(resultado)) >= 0;
}
