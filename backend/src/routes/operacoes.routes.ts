import { Router } from 'express';
import { OperacoesController } from '../controllers/operacoes.controller';

const operacoesRoutes = Router();

operacoesRoutes.post('/', OperacoesController.lancar);

export { operacoesRoutes };