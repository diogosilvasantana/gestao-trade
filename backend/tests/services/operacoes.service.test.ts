// backend/tests/services/operacoes.service.test.ts
import { Decimal } from 'decimal.js';
import { prismaMock } from '../setup/prisma-mock';
import { OperacoesService } from '../../src/services/operacoes.service';
import { CreateOperacaoDTO } from '../../src/types/operacoes';

jest.mock('../../src/utils/calculos', () => ({
    avaliarRollback: jest.fn().mockReturnValue({ houveRollback: false, novosContratos: 3 })
}));

describe('OperacoesService', () => {
    it('deve calcular o resultado automaticamente e lançar a operação atualizando o saldo', async () => {
        const dto: CreateOperacaoDTO = {
            contaId: 'conta-123',
            ativo: 'WINJ26',
            quantidade: 5,
            precoEntrada: new Decimal(120000),
            precoSaida: new Decimal(120500),
            tipo: 'Compra',
            // resultado NÃO é passado — calculado no service: (120500 - 120000) * 5 = 2500
        };

        prismaMock.conta.findUnique.mockResolvedValue({
            id: 'conta-123',
            tipo: 'Real',
            saldoAtual: new Decimal(3500),
            rollbackAtivo: true,
            contaReal: { contratosAtuais: 3, regraContratosBase: new Decimal(1000) }
        } as any);

        prismaMock.$transaction.mockResolvedValue({
            id: 'op-123',
            resultado: new Decimal(2500)
        } as any);

        const result = await OperacoesService.lancarOperacao(dto);

        expect(result).toBeDefined();
        expect(prismaMock.conta.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 'conta-123' } })
        );
        expect(prismaMock.$transaction).toHaveBeenCalled();
    });
});