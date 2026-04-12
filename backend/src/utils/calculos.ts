import { Decimal } from 'decimal.js';

export function calcularContratos(saldoAtual: Decimal, basePorContrato: Decimal): number {
    if (saldoAtual.lessThanOrEqualTo(0) || basePorContrato.lessThanOrEqualTo(0)) {
        return 1;
    }

    const contratos = saldoAtual.dividedBy(basePorContrato).floor().toNumber();
    return Math.max(1, contratos);
}

export type ResultadoRollback = {
    houveRollback: boolean;
    novosContratos: number;
};

export function avaliarRollback(
    saldoNovo: Decimal,
    contratosAtuais: number,
    basePorContrato: Decimal,
    rollbackAtivo: boolean
): ResultadoRollback {
    const contratosCalculados = calcularContratos(saldoNovo, basePorContrato);

    if (!rollbackAtivo) {
        return {
            houveRollback: false,
            novosContratos: Math.max(contratosAtuais, contratosCalculados) // pode no maximo subir, mas nunca obriga a descer se desativado (opcional de negocio)
        };
    }

    const houveRollback = contratosCalculados < contratosAtuais;

    return {
        houveRollback,
        novosContratos: houveRollback ? contratosCalculados : contratosAtuais
    };
}