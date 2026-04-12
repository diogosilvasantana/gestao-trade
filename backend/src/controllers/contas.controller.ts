// backend/src/controllers/contas.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { ContasService } from '../services/contas.service';
import { Decimal } from 'decimal.js';

// Parsers Zod para tipar runtime
const contaRealSchema = z.object({
    descricao: z.string().optional(),
    saldoInicial: z.number().transform(v => new Decimal(v)),
    rollbackAtivo: z.boolean().optional(),
    corretora: z.string().min(1),
    tipoOperacao: z.enum(['B3', 'Internacional']),
    moeda: z.enum(['BRL', 'USD']),
    regraContratosBase: z.number().optional().transform(v => v ? new Decimal(v) : undefined)
});

export class ContasController {
    static async criarReal(req: Request, res: Response) {
        try {
            const data = contaRealSchema.parse(req.body);
            const conta = await ContasService.criarContaReal(data as any);
            res.status(201).json(conta);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async listar(req: Request, res: Response) {
        const contas = await ContasService.listarContas();
        res.json(contas);
    }
}