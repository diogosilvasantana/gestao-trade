// backend/src/services/operacoes.service.ts
import { prisma } from '../config/prisma';
import { CreateOperacaoDTO } from '../types/operacoes';
import { avaliarRollback } from '../utils/calculos';
import { Decimal } from 'decimal.js';
import { FiltrosOperacoesDTO } from '../types/contas';

export class OperacoesService {
    static async lancarOperacao(data: CreateOperacaoDTO) {
        const conta = await prisma.conta.findUnique({
            where: { id: data.contaId },
            include: { contaReal: true, contaMesa: true }
        });

        if (!conta) {
            throw new Error('Conta não encontrada');
        }

        // Calcula resultado automaticamente ou usa o informado via CSV (com multiplicadores da B3)
        const diff = new Decimal(data.precoSaida).minus(data.precoEntrada);
        const bruto = diff.times(data.quantidade);
        const comissao = data.comissao ?? new Decimal(0);
        const resultadoCalculado = bruto.minus(comissao);
        
        const resultadoFinal = data.resultado !== undefined ? new Decimal(data.resultado) : resultadoCalculado;

        const saldoAnterior = conta.saldoAtual;
        const novoSaldo = new Decimal(saldoAnterior as any).plus(resultadoFinal);

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
                    comissao,
                    resultado: resultadoFinal,
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

    static async listarOperacoes(filtros: FiltrosOperacoesDTO & { contaId?: string } = {}) {
        const where: Record<string, unknown> = {};

        if (filtros.contaId) where['contaId'] = filtros.contaId;
        if (filtros.ativo) where['ativo'] = { contains: filtros.ativo, mode: 'insensitive' };
        if (filtros.tipo) where['tipo'] = filtros.tipo;
        if (filtros.resultado === 'Lucro') where['resultado'] = { gt: 0 };
        if (filtros.resultado === 'Prejuizo') where['resultado'] = { lt: 0 };
        if (filtros.dataInicio || filtros.dataFim) {
            where['data'] = {
                ...(filtros.dataInicio && { gte: filtros.dataInicio }),
                ...(filtros.dataFim && { lte: filtros.dataFim }),
            };
        }

        return prisma.operacao.findMany({
            where,
            orderBy: { data: 'desc' },
            include: { conta: { select: { tipo: true, descricao: true } } }
        });
    }

    // Processamento otimizado de importação de N operações sucessivas (CSV)
    static async importarLote(contaId: string, operacoesLote: CreateOperacaoDTO[]) {
        const conta = await prisma.conta.findUnique({
            where: { id: contaId },
            include: { contaReal: true, contaMesa: true }
        });

        if (!conta) {
            throw new Error('Conta não encontrada para importação');
        }

        // Ordenar operações por data sempre das mais antigas para as atuais para processar saldos corretamente
        operacoesLote.sort((a, b) => new Date(a.data || 0).getTime() - new Date(b.data || 0).getTime());

        return prisma.$transaction(async (tx) => {
            let saldoMutavel = new Decimal(conta.saldoAtual as any);
            let contratosAnterioresMutavel = conta.tipo === 'Real' && conta.contaReal ? conta.contaReal.contratosAtuais : 0;
            const criadas = [];

            for (const opRaw of operacoesLote) {
                // Cálculo de cada iterada do lote isolado (CSV deve mandar o resultado já que ele lê multiplicadores B3)
                const resultadoLote = opRaw.resultado !== undefined ? new Decimal(opRaw.resultado) : (new Decimal(opRaw.precoSaida).minus(opRaw.precoEntrada).times(opRaw.quantidade).minus(opRaw.comissao || 0));
                
                const saldoDaVez = saldoMutavel.plus(resultadoLote);

                let avaliacao = { houveRollback: false, novosContratos: 0 };
                if (conta.tipo === 'Real' && conta.contaReal) {
                    avaliacao = avaliarRollback(
                        saldoDaVez,
                        contratosAnterioresMutavel,
                        new Decimal(conta.contaReal.regraContratosBase as any),
                        conta.rollbackAtivo
                    );
                }

                // Salva operação
                const opDB = await tx.operacao.create({
                    data: {
                        contaId: contaId,
                        data: opRaw.data || new Date(),
                        ativo: opRaw.ativo,
                        quantidade: opRaw.quantidade,
                        precoEntrada: opRaw.precoEntrada,
                        precoSaida: opRaw.precoSaida,
                        tipo: opRaw.tipo,
                        comissao: opRaw.comissao ?? new Decimal(0),
                        resultado: resultadoLote,
                        observacoes: 'Importação via CSV'
                    }
                });

                // Registra Histórico
                await tx.historicoSaldo.create({
                    data: {
                        contaId: contaId,
                        saldoAnterior: saldoMutavel,
                        saldoNovo: saldoDaVez,
                        tipoMovimento: 'Operacao',
                        contratosAnteriores: conta.tipo === 'Real' ? contratosAnterioresMutavel : undefined,
                        contratosNovos: conta.tipo === 'Real' && avaliacao.houveRollback ? avaliacao.novosContratos : undefined,
                        houveRollback: avaliacao.houveRollback,
                        motivoRollback: avaliacao.houveRollback 
                            ? (avaliacao.novosContratos > contratosAnterioresMutavel ? 'Ganho Realizado' : 'Perda Realizada (Rollback)')
                            : undefined
                    }
                });

                // Atualiza mutáveis da iteração for loop
                saldoMutavel = saldoDaVez;
                if (avaliacao.houveRollback) {
                    contratosAnterioresMutavel = avaliacao.novosContratos;
                }
                criadas.push(opDB);
            }

            // Atualiza Account status after entire loop processes
            await tx.conta.update({
                where: { id: contaId },
                data: { saldoAtual: saldoMutavel }
            });

            if (conta.tipo === 'Real') {
                await tx.contaReal.update({
                    where: { contaId },
                    data: { contratosAtuais: contratosAnterioresMutavel }
                });
            }

            return { msg: `${criadas.length} operações importadas com sucesso.` };
        });
    }
}