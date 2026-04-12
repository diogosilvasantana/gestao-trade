import { app } from './app';
import { logger } from './config/logger';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3333;

app.listen(port, () => {
    logger.info(`Servidor rodando na porta ${port}`);
});