// backend/src/types/operacoes.ts
import { Decimal } from 'decimal.js';

export interface CreateOperacaoDTO {
    contaId: string;
    data?: Date;
    ativo: string;
    quantidade: number;
    precoEntrada: Decimal;
    precoSaida: Decimal;
    tipo: 'Compra' | 'Venda';
    comissao?: Decimal;
    observacoes?: string;
    resultado?: Decimal; // opcional para importações CSV onde o PL exato é lido
}