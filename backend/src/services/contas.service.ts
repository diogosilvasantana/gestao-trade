import { prisma } from '../config/prisma';
import { CreateContaRealDTO, CreateContaMesaDTO, EditarContaDTO, FiltrosOperacoesDTO } from '../types/contas';
import { calcularContratos } from '../utils/calculos';
import { Decimal } from 'decimal.js';

export class ContasService {
    static async criarContaReal(data: CreateContaRealDTO) {
        const contratosBase = data.regraContratosBase ?? new Decimal(1000);
        const contratosIniciais = calcularContratos(data.saldoInicial, contratosBase);

        return prisma.$transaction(async (tx) => {
            const conta = await tx.conta.create({
                data: {
                    tipo: 'Real',
                    descricao: data.descricao,
                    saldoInicial: data.saldoInicial,
                    saldoAtual: data.saldoInicial,
                    rollbackAtivo: data.rollbackAtivo ?? true,
                    contaReal: {
                        create: {
                            corretora: data.corretora,
                            tipoOperacao: data.tipoOperacao,
                            moeda: data.moeda,
                            regraContratosBase: contratosBase,
                            contratosAtuais: contratosIniciais,
                        }
                    },
                    historicoSaldo: {
                        create: {
                            saldoAnterior: new Decimal(0),
                            saldoNovo: data.saldoInicial,
                            tipoMovimento: 'Aporte',
                            contratosNovos: contratosIniciais,
                        }
                    }
                },
                include: { contaReal: true }
            });
            return conta;
        });
    }

    static async criarContaMesa(data: CreateContaMesaDTO) {
        return prisma.$transaction(async (tx) => {
            return tx.conta.create({
                data: {
                    tipo: 'MesaProprietaria',
                    descricao: data.descricao,
                    saldoInicial: data.saldoInicial,
                    saldoAtual: new Decimal(0),
                    rollbackAtivo: data.rollbackAtivo ?? true,
                    contaMesa: {
                        create: {
                            tipo: data.tipoMesa,
                            meta: data.meta,
                            perdaDiariaMaxima: data.perdaDiariaMaxima,
                            eliminaNaPerda: data.eliminaNaPerda ?? true,
                            dataInicio: data.dataInicio,
                            dataFim: data.dataFim,
                            statusAprovacao: 'Em Avaliacao'
                        }
                    },
                    historicoSaldo: {
                        create: {
                            saldoAnterior: new Decimal(0),
                            saldoNovo: data.saldoInicial,
                            tipoMovimento: 'Aporte'
                        }
                    }
                },
                include: { contaMesa: true }
            });
        });
    }

    static async listarContas() {
        return prisma.conta.findMany({
            include: { contaReal: true, contaMesa: true }
        });
    }

    static async buscarPorId(id: string) {
        return prisma.conta.findUnique({
            where: { id },
            include: { contaReal: true, contaMesa: true }
        });
    }

    static async editar(id: string, data: EditarContaDTO) {
        const conta = await prisma.conta.findUnique({
            where: { id },
            include: { contaReal: true, contaMesa: true }
        });

        if (!conta) throw new Error('Conta não encontrada');

        return prisma.$transaction(async (tx) => {
            await tx.conta.update({
                where: { id },
                data: {
                    descricao: data.descricao,
                    status: data.status,
                    rollbackAtivo: data.rollbackAtivo,
                }
            });

            if (conta.tipo === 'Real' && conta.contaReal && data.contaReal) {
                await tx.contaReal.update({
                    where: { id: conta.contaReal.id },
                    data: {
                        corretora: data.contaReal.corretora,
                        regraContratosBase: data.contaReal.regraContratosBase,
                    }
                });
            }

            if (conta.tipo === 'MesaProprietaria' && conta.contaMesa && data.contaMesa) {
                await tx.contaMesa.update({
                    where: { id: conta.contaMesa.id },
                    data: {
                        meta: data.contaMesa.meta,
                        perdaDiariaMaxima: data.contaMesa.perdaDiariaMaxima,
                        eliminaNaPerda: data.contaMesa.eliminaNaPerda,
                        dataFim: data.contaMesa.dataFim,
                        statusAprovacao: data.contaMesa.statusAprovacao,
                    }
                });
            }

            return tx.conta.findUnique({
                where: { id },
                include: { contaReal: true, contaMesa: true }
            });
        });
    }

    static async listarOperacoes(contaId: string, filtros: FiltrosOperacoesDTO = {}) {
        const where: Record<string, unknown> = { contaId };

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
        });
    }

    static async listarHistorico(contaId: string) {
        const conta = await prisma.conta.findUnique({ where: { id: contaId } });
        if (!conta) throw new Error('Conta não encontrada');

        return prisma.historicoSaldo.findMany({
            where: { contaId },
            orderBy: { data: 'desc' },
        });
    }
}