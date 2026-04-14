import { Router } from 'express';
import { OperacoesController } from '../controllers/operacoes.controller';

const operacoesRoutes = Router();

operacoesRoutes.post('/', OperacoesController.lancar);
operacoesRoutes.post('/lote', OperacoesController.importarLote);
operacoesRoutes.get('/', OperacoesController.listar);

export { operacoesRoutes };