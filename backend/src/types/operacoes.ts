// backend/src/types/operacoes.ts
import { Decimal } from 'decimal.js';

export interface CreateOperacaoDTO {
    contaId: string;
    data?: Date; // se omitida, default now()
    ativo: string;
    quantidade: number;
    precoEntrada: Decimal;
    precoSaida: Decimal;
    tipo: 'Compra' | 'Venda';
    comissao?: Decimal;
    resultado: Decimal; // valor já processado com a comissao para abater no saldo
    observacoes?: string;
}