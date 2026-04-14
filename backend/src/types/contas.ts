// backend/src/types/contas.ts
import { Decimal } from 'decimal.js';

export interface CreateContaRealDTO {
    descricao?: string;
    saldoInicial: Decimal;
    rollbackAtivo?: boolean;
    corretora: string;
    tipoOperacao: 'B3' | 'Internacional';
    moeda: 'BRL' | 'USD';
    regraContratosBase?: Decimal;
}

export interface CreateContaMesaDTO {
    descricao?: string;
    saldoInicial: Decimal;
    rollbackAtivo?: boolean;
    tipoMesa: 'Avaliacao' | 'Incubadora' | 'Patrocinada';
    meta: Decimal;
    perdaDiariaMaxima: Decimal;
    eliminaNaPerda?: boolean;
    dataInicio: Date;
    dataFim?: Date;
}

export interface EditarContaDTO {
    descricao?: string;
    status?: string;
    rollbackAtivo?: boolean;
    contaReal?: {
        corretora?: string;
        regraContratosBase?: Decimal;
    };
    contaMesa?: {
        meta?: Decimal;
        perdaDiariaMaxima?: Decimal;
        eliminaNaPerda?: boolean;
        dataFim?: Date;
        statusAprovacao?: string;
    };
}

export interface FiltrosOperacoesDTO {
    ativo?: string;
    tipo?: 'Compra' | 'Venda';
    resultado?: 'Lucro' | 'Prejuizo';
    dataInicio?: Date;
    dataFim?: Date;
}