// backend/src/controllers/contas.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { ContasService } from '../services/contas.service';
import { Decimal } from 'decimal.js';

const contaRealSchema = z.object({
    descricao: z.string().optional(),
    saldoInicial: z.number().transform(v => new Decimal(v)),
    rollbackAtivo: z.boolean().optional(),
    corretora: z.string().min(1),
    tipoOperacao: z.enum(['B3', 'Internacional']),
    moeda: z.enum(['BRL', 'USD']),
    regraContratosBase: z.number().optional().transform(v => v ? new Decimal(v) : undefined)
});

const contaMesaSchema = z.object({
    descricao: z.string().optional(),
    saldoInicial: z.number().transform(v => new Decimal(v)),
    rollbackAtivo: z.boolean().optional(),
    tipoMesa: z.enum(['Avaliacao', 'Incubadora', 'Patrocinada']),
    meta: z.number().transform(v => new Decimal(v)),
    perdaDiariaMaxima: z.number().transform(v => new Decimal(v)),
    eliminaNaPerda: z.boolean().optional(),
    dataInicio: z.string().transform(v => new Date(v)),
    dataFim: z.string().optional().transform(v => v ? new Date(v) : undefined)
});

const editarContaSchema = z.object({
    descricao: z.string().optional(),
    status: z.string().optional(),
    rollbackAtivo: z.boolean().optional(),
    contaReal: z.object({
        corretora: z.string().optional(),
        regraContratosBase: z.number().optional().transform(v => v ? new Decimal(v) : undefined)
    }).optional(),
    contaMesa: z.object({
        meta: z.number().optional().transform(v => v != null ? new Decimal(v) : undefined),
        perdaDiariaMaxima: z.number().optional().transform(v => v != null ? new Decimal(v) : undefined),
        eliminaNaPerda: z.boolean().optional(),
        dataFim: z.string().optional().transform(v => v ? new Date(v) : undefined),
        statusAprovacao: z.string().optional()
    }).optional()
});

const filtrosOpSchema = z.object({
    ativo: z.string().optional(),
    tipo: z.enum(['Compra', 'Venda']).optional(),
    resultado: z.enum(['Lucro', 'Prejuizo']).optional(),
    dataInicio: z.string().optional().transform(v => v ? new Date(v) : undefined),
    dataFim: z.string().optional().transform(v => v ? new Date(v) : undefined)
});

export class ContasController {
    static async criarReal(req: Request, res: Response) {
        try {
            const data = contaRealSchema.parse(req.body);
            const conta = await ContasService.criarContaReal(data as any);
            res.status(201).json(conta);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                res.status(400).json({ error: 'Erro de validação', detalhes: err.flatten().fieldErrors });
            } else {
                res.status(400).json({ error: err.message || 'Erro desconhecido' });
            }
        }
    }

    static async criarMesa(req: Request, res: Response) {
        try {
            const data = contaMesaSchema.parse(req.body);
            const conta = await ContasService.criarContaMesa(data as any);
            res.status(201).json(conta);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                res.status(400).json({ error: 'Erro de validação', detalhes: err.flatten().fieldErrors });
            } else {
                res.status(400).json({ error: err.message || 'Erro desconhecido' });
            }
        }
    }

    static async listar(req: Request, res: Response) {
        try {
            const contas = await ContasService.listarContas();
            res.json(contas);
        } catch (err: any) {
            console.error('ERRO EM listarContas:', err);
            res.status(500).json({ error: 'Erro ao listar contas', details: err.message, stack: err.stack });
        }
    }

    static async buscarPorId(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };
            const conta = await ContasService.buscarPorId(id);
            if (!conta) return res.status(404).json({ error: 'Conta não encontrada' });
            res.json(conta);
        } catch (err: any) {
            res.status(500).json({ error: err.message || 'Erro desconhecido' });
        }
    }

    static async editar(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };
            const data = editarContaSchema.parse(req.body);
            const conta = await ContasService.editar(id, data as any);
            res.json(conta);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                res.status(400).json({ error: 'Erro de validação', detalhes: err.flatten().fieldErrors });
            } else if (err.message === 'Conta não encontrada') {
                res.status(404).json({ error: err.message });
            } else {
                res.status(500).json({ error: err.message || 'Erro desconhecido' });
            }
        }
    }

    static async listarOperacoes(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };
            const filtros = filtrosOpSchema.parse(req.query);
            const operacoes = await ContasService.listarOperacoes(id, filtros as any);
            res.json(operacoes);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                res.status(400).json({ error: 'Filtros inválidos', detalhes: err.flatten().fieldErrors });
            } else {
                res.status(500).json({ error: err.message || 'Erro desconhecido' });
            }
        }
    }

    static async listarHistorico(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };
            const historico = await ContasService.listarHistorico(id);
            res.json(historico);
        } catch (err: any) {
            if (err.message === 'Conta não encontrada') {
                res.status(404).json({ error: err.message });
            } else {
                res.status(500).json({ error: err.message || 'Erro desconhecido' });
            }
        }
    }
}