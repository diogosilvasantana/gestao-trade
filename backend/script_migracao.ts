import { prisma } from './src/config/prisma';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await prisma.$executeRaw`UPDATE "Conta" SET "saldoAtual" = "saldoAtual" - "saldoInicial" WHERE "tipo" = 'MesaProprietaria'`;
  console.log('Migracao concluida');
}
main().finally(() => prisma.$disconnect());
