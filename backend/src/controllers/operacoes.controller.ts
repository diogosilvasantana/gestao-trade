import { Request, Response } from 'express';
import { z } from 'zod';
import { OperacoesService } from '../services/operacoes.service';
import { Decimal } from 'decimal.js';

const operacaoSchema = z.object({
    contaId: z.string(),
    data: z.string().transform(v => new Date(v)).optional(),
    ativo: z.string().min(1),
    quantidade: z.number().int().positive(),
    precoEntrada: z.number().transform(v => new Decimal(v)),
    precoSaida: z.number().transform(v => new Decimal(v)),
    tipo: z.enum(['Compra', 'Venda']),
    comissao: z.number().optional().transform(v => v ? new Decimal(v) : undefined),
    resultado: z.number().transform(v => new Decimal(v)),
    observacoes: z.string().optional()
});

export class OperacoesController {
    static async lancar(req: Request, res: Response) {
        try {
            const data = operacaoSchema.parse(req.body);
            const operacao = await OperacoesService.lancarOperacao(data as any);
            res.status(201).json(operacao);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                // Formata os erros do Zod para um array mais legível sem estourar a tipagem abstrata
                res.status(400).json({ error: 'Erro de validação', detalhes: err.flatten().fieldErrors });
            } else {
                res.status(400).json({ error: err.message || 'Erro desconhecido' });
            }
        }
    }
}