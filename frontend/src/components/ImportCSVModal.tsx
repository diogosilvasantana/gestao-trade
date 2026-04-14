import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { X, UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';
import { Conta, operacoesApi, taxasApi } from '../lib/api';

interface ImportCSVModalProps {
    isOpen: boolean;
    onClose: () => void;
    contas: Conta[];
    onSuccess: () => void;
}

export function ImportCSVModal({ isOpen, onClose, contas, onSuccess }: ImportCSVModalProps) {
    const [selectedConta, setSelectedConta] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewCount, setPreviewCount] = useState<number | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);

    // Taxas Dinâmicas carregadas do BD
    const [taxasParametrizadas, setTaxasParametrizadas] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            taxasApi.listar()
                .then(setTaxasParametrizadas)
                .catch(err => console.error('Erro ao buscar taxas operacionais', err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const parseNumberBR = (val: string) => {
        if (!val) return 0;
        const limpo = val.replace(/\./g, '').replace(',', '.');
        return parseFloat(limpo) || 0;
    };

    const parseDateBR = (val: string) => {
        if (!val) return new Date().toISOString();
        // 13/04/2026 09:55:24
        const parts = val.split(' ');
        const dateParts = parts[0].split('/');
        if (dateParts.length === 3) {
            const time = parts[1] || '00:00:00';
            return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${time}-03:00`;
        }
        return new Date().toISOString();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        setFile(selected);
        setError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split('\n');
                
                // Encontrar o cabeçalho real da tabela para ignorar as linhas inúteis do topo
                const headerIndex = lines.findIndex(l => l.includes('Ativo;') && l.includes('Abertura;') && l.includes('Lado;'));
                if (headerIndex === -1) {
                    setError("Formato não reconhecido. Cabeçalho com 'Ativo', 'Abertura' e 'Lado' não encontrado.");
                    return;
                }

                const usefulCsv = lines.slice(headerIndex).join('\n');

                Papa.parse(usefulCsv, {
                    header: true,
                    delimiter: ';',
                    skipEmptyLines: true,
                    complete: (results) => {
                        const operations = results.data.filter((row: any) => row.Ativo && row.Ativo.trim() !== '');

                        const mapped = operations.map((row: any) => {
                            const isCompra = row['Lado']?.toUpperCase() === 'C';
                            const pCompra = parseNumberBR(row['Preço Compra'] || row['Preo Compra']);
                            const pVenda = parseNumberBR(row['Preço Venda'] || row['Preo Venda']);
                            
                            // Em algumas plataformas, a coluna Abertura dita a hora de início
                            const dataFormatada = parseDateBR(row['Abertura']);
                            
                            // Quantidade total movimentada (para taxas de Abertura + Saída)
                            const qCompra = parseNumberBR(row['Qtd Compra']) || 0;
                            const qVenda = parseNumberBR(row['Qtd Venda']) || 0;
                            const volumeOperado = (qCompra > 0 && qVenda > 0) ? (qCompra + qVenda) : (qCompra || qVenda || 1);
                            
                            // Apenas para salvar no banco o "tamanho da mão" posicionada
                            const qtdPosicao = qCompra || qVenda || 1;

                            // Preço de Entrada / Saída baseados no lado posicionado da abertura do trade
                            const precoEntrada = isCompra ? pCompra : pVenda;
                            const precoSaida = isCompra ? pVenda : pCompra;

                            const ativoName = row.Ativo || '';
                            let custoUnicoContrato = 0;
                            
                            // Buscar taxa na lista dinâmica baseada no inicio do ativo
                            const taxaEncontrada = taxasParametrizadas.find(t => ativoName.startsWith(t.ativoSigla));
                            if (taxaEncontrada) {
                                custoUnicoContrato = Number(taxaEncontrada.valorPorContrato);
                            }

                            // Comissão cobrada pela B3 ocorre na Entrada e na Saída (Portanto, multiplica pelo volume dobrado)
                            const comissaoFinal = custoUnicoContrato * volumeOperado;

                            // Res. Operação (Bruto lido do Profit)
                            let resultadoBrutoStr = row['Res. Operação'] || row['Res. Operao'] || row['Res. Intervalo Bruto'];
                            let resultadoBruto = parseNumberBR(resultadoBrutoStr);
                            
                            if (isNaN(resultadoBruto) || resultadoBruto === 0) {
                                const diff = precoSaida - precoEntrada;
                                resultadoBruto = isCompra ? diff * qtdPosicao : (precoEntrada - precoSaida) * qtdPosicao;
                            }
                            
                            // Abate do Líquido (Líquido = Bruto - Custos da B3)
                            const resultadoLiquido = resultadoBruto - comissaoFinal;

                            return {
                                ativo: ativoName,
                                tipo: isCompra ? 'Compra' : 'Venda',
                                quantidade: qtdPosicao,
                                precoEntrada,
                                precoSaida,
                                comissao: comissaoFinal,
                                resultado: resultadoLiquido,
                                data: dataFormatada
                            };
                        });

                        setParsedData(mapped);
                        setPreviewCount(mapped.length);
                    },
                    error: (err) => {
                        setError('Erro ao ler CSV: ' + err.message);
                    }
                });

            } catch (err) {
                setError('Erro catastrófico lendo o CSV. Verifique a codificação.');
            }
        };
        reader.readAsText(selected, 'ISO-8859-1'); // Planilhas BR Profit normalmente ISO
    };

    const handleSubmit = async () => {
        if (!selectedConta) {
            setError('Selecione uma conta de destino primeiro.');
            return;
        }

        if (parsedData.length === 0) {
            setError('Nenhuma operação lida do arquivo.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await operacoesApi.importarLote({
                contaId: selectedConta,
                operacoes: parsedData
            });
            onSuccess();
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Erro desconhecido ao comunicar backend.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[var(--color-navy-800)] rounded-xl border border-[var(--color-navy-600)] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-navy-600)]">
                    <h2 className="text-lg font-bold text-[var(--color-text-main)]">Importar Planilha (ProfitChart)</h2>
                    <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]" disabled={loading}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded bg-[var(--color-danger-dim)] text-[var(--color-danger)] text-sm border border-[var(--color-danger)]">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Conta de Destino</label>
                        <select
                            className="input-field"
                            value={selectedConta}
                            onChange={(e) => setSelectedConta(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Selecione a conta...</option>
                            {contas.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.tipo} - {c.descricao || (c.contaReal ? c.contaReal.corretora : c.contaMesa?.tipo)}
                                </option>
                            ))}
                        </select>
                    </div>
                    {taxasParametrizadas.length > 0 && (
                        <div className="pt-2 border-t border-[var(--color-navy-600)]">
                            <p className="text-xs text-[var(--color-text-muted)] italic">
                                Os custos estão sendo identificados e deduzidos automaticamente baseados na Tabela Global de <span className="font-bold text-[var(--color-text-main)]">Configurações</span>.
                            </p>
                        </div>
                    )}

                    <div 
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                            ${file ? 'border-[var(--color-brand-primary)] bg-[var(--color-navy-700)]' : 'border-[var(--color-navy-600)] hover:border-[var(--color-brand-primary)]'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            accept=".csv" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                        <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${file ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                        {file ? (
                            <p className="font-semibold text-[var(--color-brand-primary)]">{file.name}</p>
                        ) : (
                            <div>
                                <p className="font-semibold text-[var(--color-text-main)]">Clique para selecionar o .csv</p>
                                <p className="text-sm text-[var(--color-text-muted)] mt-1">Formato suportado: Relatório de Operações Profit</p>
                            </div>
                        )}
                    </div>

                    {previewCount !== null && (
                        <div className="flex items-center justify-between p-3 rounded bg-[var(--color-success-dim)] border border-[var(--color-success)] text-[var(--color-success)]">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-semibold">{previewCount} operações processadas prontas para importar.</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-[var(--color-navy-600)] bg-[var(--color-navy-900)] flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="btn-secondary"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="btn-primary"
                        disabled={loading || !file || !selectedConta || parsedData.length === 0}
                    >
                        {loading ? 'Importando...' : 'Confirmar Importação'}
                    </button>
                </div>
            </div>
        </div>
    );
}
