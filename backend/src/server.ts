import { app } from './app';
import { logger } from './config/logger';
import dotenv from 'dotenv';
import { TaxasService } from './services/taxas.service';

dotenv.config();

const port = process.env.PORT || 3333;

app.listen(port, async () => {
    logger.info(`Servidor rodando na porta ${port}`);
    await TaxasService.inicializarDefaults().catch(err => logger.error('Erro ao inicializar defaults: ' + err));
});
 
