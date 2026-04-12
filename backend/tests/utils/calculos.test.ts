import { Decimal } from 'decimal.js';
import { calcularContratos, avaliarRollback } from '../../src/utils/calculos';

describe('Cálculos Core', () => {
    describe('calcularContratos', () => {
        it('deve retornar 1 contrato para saldo menor que a base (ex: regra 1000, saldo 500)', () => {
            const saldo = new Decimal(500);
            const base = new Decimal(1000);
            expect(calcularContratos(saldo, base)).toBe(1);
        });

        it('deve retornar 3 contratos para saldo de 3500 com base 1000', () => {
            const saldo = new Decimal(3500);
            const base = new Decimal(1000);
            expect(calcularContratos(saldo, base)).toBe(3);
        });
    });

    describe('avaliarRollback', () => {
        it('deve detectar rollback se novos contratos forem menores que os antigos e rollback estiver ativo', () => {
            const saldoAnterior = new Decimal(3500); // 3 contratos
            const saldoNovo = new Decimal(2800); // 2 contratos
            const contratosAtuais = 3;
            const base = new Decimal(1000);

            const resultado = avaliarRollback(saldoNovo, contratosAtuais, base, true);

            expect(resultado.houveRollback).toBe(true);
            expect(resultado.novosContratos).toBe(2);
        });

        it('não deve detectar rollback se novos contratos não forem menores', () => {
            const saldoAnterior = new Decimal(3000);
            const saldoNovo = new Decimal(3800);
            const contratosAtuais = 3;
            const base = new Decimal(1000);

            const resultado = avaliarRollback(saldoNovo, contratosAtuais, base, true);

            expect(resultado.houveRollback).toBe(false);
            expect(resultado.novosContratos).toBe(3);
        });

        it('não deve fazer rollback se a configuração de rollback estiver inativa na conta', () => {
            const saldoNovo = new Decimal(2800);
            const contratosAtuais = 3;
            const base = new Decimal(1000);

            // rollback is inactive
            const resultado = avaliarRollback(saldoNovo, contratosAtuais, base, false);

            expect(resultado.houveRollback).toBe(false);
            expect(resultado.novosContratos).toBe(3); // Mantém os contratos, assumindo o risco
        });
    });
});