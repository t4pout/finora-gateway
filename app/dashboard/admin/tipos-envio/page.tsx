'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, Truck } from 'lucide-react';

interface TipoEnvio {
  id: string;
  nome: string;
  prazoDias: number;
  ativo: boolean;
}

export default function TiposEnvioPage() {
  const router = useRouter();
  const [tipos, setTipos] = useState<TipoEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ aberto: boolean; tipo: TipoEnvio | null }>({ aberto: false, tipo: null });
  const [form, setForm] = useState({ nome: '', prazoDias: '', ativo: true });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    carregarTipos();
  }, []);

  const carregarTipos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tipos-envio', { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) { const data = await res.json(); setTipos(data); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const abrirNovo = () => {
    setForm({ nome: '', prazoDias: '', ativo: true });
    setModal({ aberto: true, tipo: null });
  };

  const abrirEditar = (tipo: TipoEnvio) => {
    setForm({ nome: tipo.nome, prazoDias: tipo.prazoDias.toString(), ativo: tipo.ativo });
    setModal({ aberto: true, tipo });
  };

  const salvar = async () => {
    if (!form.nome || !form.prazoDias) { alert('Preencha nome e prazo'); return; }
    try {
      const token = localStorage.getItem('token');
      const url = modal.tipo ? `/api/tipos-envio/${modal.tipo.id}` : '/api/tipos-envio';
      const method = modal.tipo ? 'PUT' : 'POST';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(form) });
      alert(modal.tipo ? 'Atualizado!' : 'Criado!');
      setModal({ aberto: false, tipo: null });
      carregarTipos();
    } catch (e) { alert('Erro ao salvar'); }
  };

  const excluir = async (id: string) => {
    if (!confirm('Excluir este tipo de envio? Opções de frete ligadas a ele perderão a associação.')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/tipos-envio/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
      carregarTipos();
    } catch (e) { alert('Erro ao excluir'); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-finoradark-bg flex items-center justify-center"><div className="text-gray-900 dark:text-finoradark-text">Carregando...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-finoradark-bg p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/admin"><button className="flex items-center space-x-2 text-gray-600 dark:text-finoradark-textmuted hover:text-purple-600 dark:hover:text-finoradark-glow transition"><ArrowLeft size={20} /><span>Voltar</span></button></Link>
        </div>

        <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-finoradark-text flex items-center gap-2"><Truck size={24} />Tipos de Envio</h1>
              <p className="text-gray-600 dark:text-finoradark-textmuted">Configure os prazos usados no rastreamento próprio da Finora</p>
            </div>
            <button onClick={abrirNovo} className="px-6 py-3 bg-purple-600 dark:bg-finoradark-glow text-white rounded-lg font-semibold hover:bg-purple-700 dark:hover:opacity-90 transition flex items-center space-x-2">
              <Plus size={20} /><span>Novo Tipo</span>
            </button>
          </div>

          {tipos.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-finoradark-card2 rounded-xl">
              <Truck size={64} className="mx-auto text-gray-300 dark:text-finoradark-border mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-finoradark-text mb-2">Nenhum tipo de envio cadastrado</h3>
              <p className="text-gray-600 dark:text-finoradark-textmuted mb-6">Ex: Mala Direta (30 dias), Mini Envios (15 dias)</p>
              <button onClick={abrirNovo} className="px-6 py-3 bg-purple-600 dark:bg-finoradark-glow text-white rounded-lg font-semibold hover:bg-purple-700 dark:hover:opacity-90 transition">Criar Primeiro Tipo</button>
            </div>
          ) : (
            <div className="space-y-3">
              {tipos.map((t) => (
                <div key={t.id} className="border-2 border-gray-200 dark:border-finoradark-border rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-finoradark-text">{t.nome} {!t.ativo && <span className="text-sm font-normal text-gray-400">(inativo)</span>}</div>
                    <div className="text-sm text-gray-600 dark:text-finoradark-textmuted">Prazo estimado: {t.prazoDias} dias</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => abrirEditar(t)} className="px-4 py-2 border-2 border-gray-300 dark:border-finoradark-border text-gray-700 dark:text-finoradark-textmuted rounded-lg hover:bg-gray-50 dark:hover:bg-finoradark-card2 transition"><Edit size={16} /></button>
                    <button onClick={() => excluir(t.id)} className="px-4 py-2 border-2 border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal.aberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setModal({ aberto: false, tipo: null })}>
          <div className="bg-white dark:bg-finoradark-card rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-finoradark-text mb-6">{modal.tipo ? 'Editar Tipo de Envio' : 'Novo Tipo de Envio'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-finoradark-text mb-2">Nome *</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 dark:text-finoradark-text rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" placeholder="Ex: Mala Direta" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-finoradark-text mb-2">Prazo estimado (dias) *</label>
                <input type="number" min="1" value={form.prazoDias} onChange={(e) => setForm({...form, prazoDias: e.target.value})} className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 dark:text-finoradark-text rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" placeholder="30" />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({...form, ativo: e.target.checked})} className="w-4 h-4 cursor-pointer" />
                <span className="text-sm text-gray-600 dark:text-finoradark-textmuted">Ativo (disponível para vincular a fretes)</span>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setModal({ aberto: false, tipo: null })} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-finoradark-border text-gray-700 dark:text-finoradark-textmuted rounded-lg font-semibold">Cancelar</button>
                <button onClick={salvar} className="flex-1 px-6 py-3 bg-purple-600 dark:bg-finoradark-glow text-white rounded-lg font-semibold hover:bg-purple-700 dark:hover:opacity-90 transition">{modal.tipo ? 'Salvar' : 'Criar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}