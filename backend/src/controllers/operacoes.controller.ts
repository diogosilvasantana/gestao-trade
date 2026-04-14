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
    resultado: z.number().optional().transform(v => v !== undefined ? new Decimal(v) : undefined),
    observacoes: z.string().optional()
});

const loteSchema = z.object({
    contaId: z.string(),
    operacoes: z.array(z.object({
        data: z.string().transform(v => new Date(v)).optional(),
        ativo: z.string().min(1),
        quantidade: z.number().int().positive(),
        precoEntrada: z.number().transform(v => new Decimal(v)),
        precoSaida: z.number().transform(v => new Decimal(v)),
        tipo: z.enum(['Compra', 'Venda']),
        resultado: z.number().transform(v => new Decimal(v)),
    }))
});

const filtrosSchema = z.object({
    contaId: z.string().optional(),
    ativo: z.string().optional(),
    tipo: z.enum(['Compra', 'Venda']).optional(),
    resultado: z.enum(['Lucro', 'Prejuizo']).optional(),
    dataInicio: z.string().optional().transform(v => v ? new Date(v) : undefined),
    dataFim: z.string().optional().transform(v => v ? new Date(v) : undefined)
});

export class OperacoesController {
    static async lancar(req: Request, res: Response) {
        try {
            const data = operacaoSchema.parse(req.body);
            const operacao = await OperacoesService.lancarOperacao(data as any);
            res.status(201).json(operacao);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                res.status(400).json({ error: 'Erro de validação', detalhes: err.flatten().fieldErrors });
            } else {
                res.status(400).json({ error: err.message || 'Erro desconhecido' });
            }
        }
    }

    static async importarLote(req: Request, res: Response) {
        try {
            const data = loteSchema.parse(req.body);
            const resultado = await OperacoesService.importarLote(data.contaId, data.operacoes as any);
            res.status(201).json(resultado);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                res.status(400).json({ error: 'Erro de validação no CSV importado', detalhes: err.flatten().fieldErrors });
            } else {
                res.status(400).json({ error: err.message || 'Erro sistemico na importação' });
            }
        }
    }

    static async listar(req: Request, res: Response) {
        try {
            const filtros = filtrosSchema.parse(req.query);
            const operacoes = await OperacoesService.listarOperacoes(filtros as any);
            res.json(operacoes);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                res.status(400).json({ error: 'Filtros inválidos', detalhes: err.flatten().fieldErrors });
            } else {
                res.status(500).json({ error: err.message || 'Erro desconhecido' });
            }
        }
    }
}