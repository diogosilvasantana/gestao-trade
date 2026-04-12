import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import { contasRoutes } from './routes/contas.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/contas', contasRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Tratamento de erros genérico
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err);
    res.status(500).json({ error: 'Erro interno no servidor' });
});

export { app };