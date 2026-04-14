import { prisma } from '../config/prisma';
import { Decimal } from 'decimal.js';

export class TaxasService {
    // Busca todas as taxas da base
    static async listarTaxas() {
        return prisma.taxaOperacional.findMany({
            orderBy: { nome: 'asc' }
        });
    }

    // Atualiza um valor existente
    static async atualizarTaxa(id: string, valor: number) {
        return prisma.taxaOperacional.update({
            where: { id },
            data: { valorPorContrato: new Decimal(valor) }
        });
    }

    // Processo de inicialização padrão (Seed)
    static async inicializarDefaults() {
        const count = await prisma.taxaOperacional.count();
        if (count === 0) {
            console.log('🌱 Inicializando taxas da BMF operacionais default...');
            await prisma.taxaOperacional.createMany({
                data: [
                    { ativoSigla: 'WIN', nome: 'Mini Índice', valorPorContrato: new Decimal(1.00) },
                    { ativoSigla: 'WDO', nome: 'Mini Dólar', valorPorContrato: new Decimal(1.50) },
                    { ativoSigla: 'IND', nome: 'Índice Cheio', valorPorContrato: new Decimal(3.00) },
                    { ativoSigla: 'DOL', nome: 'Dólar Cheio', valorPorContrato: new Decimal(4.50) },
                    { ativoSigla: 'BIT', nome: 'Bitcoin', valorPorContrato: new Decimal(0.20) },
                ]
            });
            console.log('✅ Taxas padrão inseridas com sucesso.');
        }
    }
}
