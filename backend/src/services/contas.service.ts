import { prisma } from '../config/prisma';
import { CreateContaRealDTO, CreateContaMesaDTO } from '../types/contas';
import { calcularContratos } from '../utils/calculos';
import { Decimal } from 'decimal.js'; // <-- Import adicionado

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
                    saldoAtual: data.saldoInicial,
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
}