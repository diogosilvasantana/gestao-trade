// backend/src/routes/contas.routes.ts
import { Router } from 'express';
import { ContasController } from '../controllers/contas.controller';

const contasRoutes = Router();

contasRoutes.post('/real', ContasController.criarReal);
contasRoutes.post('/mesa', ContasController.criarMesa);
contasRoutes.get('/', ContasController.listar);
contasRoutes.get('/:id', ContasController.buscarPorId);
contasRoutes.patch('/:id', ContasController.editar);
contasRoutes.get('/:id/operacoes', ContasController.listarOperacoes);
contasRoutes.get('/:id/historico', ContasController.listarHistorico);

export { contasRoutes };