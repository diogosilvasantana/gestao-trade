import { ContasService } from './src/services/contas.service';

async function main() {
  try {
    const contas = await ContasService.listarContas();
    console.log('CONTAS SUCESSO:', contas);
  } catch (err) {
    console.error('ERRO EM listarContas:');
    console.error(err);
  }
}

main();
