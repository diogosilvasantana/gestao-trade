// backend/src/services/operacoes.service.ts
import { prisma } from '../config/prisma';
import { CreateOperacaoDTO } from '../types/operacoes';
import { avaliarRollback } from '../utils/calculos';
import { Decimal } from 'decimal.js';

export class OperacoesService {
    static async lancarOperacao(data: CreateOperacaoDTO) {
        const conta = await prisma.conta.findUnique({
            where: { id: data.contaId },
            include: { contaReal: true, contaMesa: true }
        });

        if (!conta) {
            throw new Error('Conta não encontrada');
        }

        const saldoAnterior = conta.saldoAtual;
        // O Prisma/Decimal.js espera tipos numéricos ou string no builder, e os models exportados tipam como new Decimal. 
        // É importante lidar com o retorno do DB como Decimal
        const novoSaldo = new Decimal(saldoAnterior as any).plus(data.resultado);

        let contratosAnteriores = 0;
        let avaliacao = { houveRollback: false, novosContratos: 0 };

        if (conta.tipo === 'Real' && conta.contaReal) {
            contratosAnteriores = conta.contaReal.contratosAtuais;
            avaliacao = avaliarRollback(
                novoSaldo,
                contratosAnteriores,
                new Decimal(conta.contaReal.regraContratosBase as any),
                conta.rollbackAtivo
            );
        }

        return prisma.$transaction(async (tx) => {
            const op = await tx.operacao.create({
                data: {
                    contaId: data.contaId,
                    data: data.data || new Date(),
                    ativo: data.ativo,
                    quantidade: data.quantidade,
                    precoEntrada: data.precoEntrada,
                    precoSaida: data.precoSaida,
                    tipo: data.tipo,
                    comissao: data.comissao || new Decimal(0),
                    resultado: data.resultado,
                    observacoes: data.observacoes
                }
            });

            await tx.conta.update({
                where: { id: data.contaId },
                data: { saldoAtual: novoSaldo }
            });

            if (conta.tipo === 'Real' && conta.contaReal) {
                await tx.contaReal.update({
                    where: { id: conta.contaReal.id },
                    data: { contratosAtuais: avaliacao.novosContratos }
                });
            }

            await tx.historicoSaldo.create({
                data: {
                    contaId: data.contaId,
                    saldoAnterior: saldoAnterior,
                    saldoNovo: novoSaldo,
                    tipoMovimento: 'Operacao',
                    /* Se for conta real temos dados pra salvar métricas de contratos */
                    ...(conta.tipo === 'Real' ? {
                        contratosAnteriores,
                        contratosNovos: avaliacao.novosContratos,
                        houveRollback: avaliacao.houveRollback,
                        motivoRollback: avaliacao.houveRollback ? 'Detecção automática pós-operação (Prejuízo)' : null
                    } : {})
                }
            });

            return op;
        });
    }
}