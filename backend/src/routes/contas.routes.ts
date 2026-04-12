// backend/src/routes/contas.routes.ts
import { Router } from 'express';
import { ContasController } from '../controllers/contas.controller';

const contasRoutes = Router();

contasRoutes.post('/real', ContasController.criarReal);
contasRoutes.get('/', ContasController.listar);

export { contasRoutes };