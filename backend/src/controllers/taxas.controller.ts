import { Request, Response } from 'express';
import { z } from 'zod';
import { TaxasService } from '../services/taxas.service';

const updateTaxaSchema = z.object({
    valor: z.number().min(0)
});

export class TaxasController {
    static async listar(req: Request, res: Response) {
        try {
            const taxas = await TaxasService.listarTaxas();
            res.json(taxas);
        } catch (err: any) {
            res.status(500).json({ error: err.message || 'Erro ao listar taxas' });
        }
    }

    static async atualizar(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const data = updateTaxaSchema.parse(req.body);
            const taxaAtualizada = await TaxasService.atualizarTaxa(id, data.valor);
            res.json(taxaAtualizada);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                res.status(400).json({ error: 'Valor inválido', detalhes: err.flatten().fieldErrors });
            } else {
                res.status(400).json({ error: err.message || 'Erro ao atualizar taxa' });
            }
        }
    }
}
