import { prisma } from './src/config/prisma'; 
import dotenv from 'dotenv'; 
dotenv.config();

async function main() { 
  await prisma.operacao.deleteMany(); 
  await prisma.$executeRaw`UPDATE "Conta" SET "saldoAtual" = "saldoInicial" WHERE "tipo" = 'Real'`; 
  await prisma.$executeRaw`UPDATE "Conta" SET "saldoAtual" = 0 WHERE "tipo" = 'MesaProprietaria'`; 
  console.log('Zeradinha'); 
} 
main().finally(() => prisma.$disconnect());
