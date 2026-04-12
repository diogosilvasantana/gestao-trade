// backend/tests/services/operacoes.service.test.ts
import { Decimal } from 'decimal.js';
import { prismaMock } from '../setup/prisma-mock';
import { OperacoesService } from '../../src/services/operacoes.service';
import { CreateOperacaoDTO } from '../../src/types/operacoes';

// Simularemos o modulo de calculos para não depender dele internamente
jest.mock('../../src/utils/calculos', () => ({
    avaliarRollback: jest.fn().mockReturnValue({ houveRollback: false, novosContratos: 3 })
}));

describe('OperacoesService', () => {
    it('deve inserir uma operacao com sucesso atualizando saldos sem causar rollback', async () => {
        const dto: CreateOperacaoDTO = {
            contaId: 'conta-123',
            ativo: 'WIN',
            quantidade: 5,
            precoEntrada: new Decimal(100000),
            precoSaida: new Decimal(100500),
            tipo: 'Compra',
            resultado: new Decimal(500) // lucrou 500 reais 
        };

        // O Mock precisa nos retornar a conta para sabermos os parametros de rollback
        prismaMock.conta.findUnique.mockResolvedValue({
            id: 'conta-123',
            tipo: 'Real',
            saldoAtual: new Decimal(3500),
            rollbackAtivo: true,
            contaReal: { contratosAtuais: 3, regraContratosBase: new Decimal(1000) }
        } as any);

        prismaMock.$transaction.mockResolvedValue({
            id: 'op-123',
            resultado: new Decimal(500)
        } as any);

        const result = await OperacoesService.lancarOperacao(dto);

        expect(result).toBeDefined();
        expect(prismaMock.conta.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'conta-123' } }));
        expect(prismaMock.$transaction).toHaveBeenCalled();
    });
});