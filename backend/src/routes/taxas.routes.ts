import { Router } from 'express';
import { TaxasController } from '../controllers/taxas.controller';

const taxasRoutes = Router();

taxasRoutes.get('/', TaxasController.listar);
taxasRoutes.patch('/:id', TaxasController.atualizar);

export { taxasRoutes };
