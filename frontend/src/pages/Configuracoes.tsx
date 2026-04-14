import React, { useEffect, useState } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { taxasApi, formatBRL } from '../lib/api';

export function Configuracoes() {
    const [taxas, setTaxas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        carregarTaxas();
    }, []);

    const carregarTaxas = () => {
        setLoading(true);
        taxasApi.listar()
            .then(data => {
                setTaxas(data);
                setLoading(false);
            })
            .catch(err => {
                setError('Erro ao carregar configurações de taxas. O Backend está rodando?');
                setLoading(false);
            });
    };

    const handleEdit = (taxa: any) => {
        setEditingId(taxa.id);
        setEditValue(Number(taxa.valorPorContrato));
        setSuccessMsg(null);
        setError(null);
    };

    const handleSave = async (id: string) => {
        try {
            await taxasApi.atualizar(id, editValue);
            setSuccessMsg('Taxa atualizada com sucesso!');
            setEditingId(null);
            carregarTaxas();
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Falha ao salvar a taxa.');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between bg-gradient-to-r from-[var(--color-navy-800)] to-[var(--color-navy-900)] p-6 rounded-2xl border border-[var(--color-navy-700)] shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Settings className="text-[var(--color-brand-primary)]" />
                        Configurações Globais
                    </h1>
                    <p className="text-[var(--color-text-muted)] mt-1">
                        Gerencie os custos de corretagem e taxas (B3, Mercado Internacional) para dedução automática do resultado líquido em toda a plataforma.
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-[var(--color-danger-dim)] border border-[var(--color-danger)] text-[var(--color-danger)] p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                        <p className="font-semibold">Erro de Conexão</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {successMsg && (
                <div className="bg-[var(--color-success-dim)] border border-[var(--color-success)] text-[var(--color-success)] p-4 rounded-xl font-semibold text-center">
                    {successMsg}
                </div>
            )}

            <div className="bg-[var(--color-navy-800)] rounded-xl border border-[var(--color-navy-700)] overflow-hidden shadow-lg">
                <div className="p-4 border-b border-[var(--color-navy-600)]">
                    <h2 className="text-lg font-semibold text-[var(--color-text-main)]">Taxas Operacionais de OMS (BMF / Internacional)</h2>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-[var(--color-text-muted)]">Carregando parâmetros do sistema...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--color-navy-900)] text-[var(--color-text-muted)] text-sm">
                                <th className="p-4 font-semibold w-1/4">Ativo</th>
                                <th className="p-4 font-semibold w-1/4">Abreviação</th>
                                <th className="p-4 font-semibold w-1/4">Valor Por Contrato (R$)</th>
                                <th className="p-4 font-semibold text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-navy-700)]">
                            {taxas.map((taxa) => (
                                <tr key={taxa.id} className="hover:bg-[var(--color-navy-900)]/50 transition-colors">
                                    <td className="p-4 font-semibold text-[var(--color-text-main)]">{taxa.nome}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-[var(--color-navy-700)] text-xs font-bold text-[var(--color-text-secondary)]">
                                            {taxa.ativoSigla}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {editingId === taxa.id ? (
                                            <div className="relative w-32">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm font-bold">R$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="input-field pl-9 py-1 h-9"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(Number(e.target.value))}
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <span className="font-semibold text-[var(--color-text-main)]">
                                                {formatBRL(taxa.valorPorContrato)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {editingId === taxa.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1 rounded bg-[var(--color-navy-700)] text-[var(--color-text-muted)] hover:bg-[var(--color-navy-600)]">Cancelar</button>
                                                <button onClick={() => handleSave(taxa.id)} className="flex items-center gap-1 text-xs px-3 py-1 rounded bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-light)]">
                                                    <Save className="w-3 h-3" /> Salvar
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEdit(taxa)} className="text-sm font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-light)]">
                                                Editar Custo
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
