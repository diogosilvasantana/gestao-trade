// backend/tests/services/contas.service.test.ts
import { Decimal } from 'decimal.js';
import { prismaMock } from '../setup/prisma-mock';
import { ContasService } from '../../src/services/contas.service';
import { CreateContaMesaDTO, CreateContaRealDTO } from '../../src/types/contas';

describe('ContasService', () => {
    it('deve criar uma conta real com sucesso calculando os contratos', async () => {
        const dto: CreateContaRealDTO = {
            saldoInicial: new Decimal(3500),
            corretora: 'XP',
            tipoOperacao: 'B3',
            moeda: 'BRL',
            descricao: 'Teste',
            regraContratosBase: new Decimal(1000)
        };

        const expectedConta = {
            id: '123',
            tipo: 'Real',
            saldoInicial: new Decimal(3500),
            saldoAtual: new Decimal(3500),
            descricao: 'Teste',
            rollbackAtivo: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            contaReal: {
                id: '1',
                contaId: '123',
                corretora: 'XP',
                tipoOperacao: 'B3',
                moeda: 'BRL',
                contratosAtuais: 3,
                regraContratosBase: new Decimal(1000)
            }
        };

        // Simulando a transação do prisma retornando o obj esperado
        prismaMock.$transaction.mockResolvedValue(expectedConta as any); // "as any" ajuda a bypassar inferências muito estritas no mock de transaction

        const result = await ContasService.criarContaReal(dto);

        expect(result).toBeDefined();
        // Usamos o '!' aqui para garantir ao TS que contaReal existe neste contexto
        expect(result.contaReal!.contratosAtuais).toBe(3);
        expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('deve criar uma conta mesa com sucesso', async () => {
        const dto: CreateContaMesaDTO = {
            saldoInicial: new Decimal(100000),
            tipoMesa: 'Avaliacao',
            meta: new Decimal(10000),
            perdaDiariaMaxima: new Decimal(3000),
            dataInicio: new Date()
        };

        const expectedConta = {
            id: '456',
            tipo: 'MesaProprietaria',
            saldoInicial: new Decimal(100000),
            saldoAtual: new Decimal(100000),
            contaMesa: {
                id: '2',
                tipo: 'Avaliacao'
            }
        };

        prismaMock.$transaction.mockResolvedValue(expectedConta);

        const result = await ContasService.criarContaMesa(dto);

        expect(result).toBeDefined();
        expect(result.tipo).toBe('MesaProprietaria');
    });
});