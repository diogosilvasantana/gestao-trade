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