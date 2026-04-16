'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

interface Despesa {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  recorrente: boolean;
}

const categorias = ['ANUNCIO', 'FUNCIONARIO', 'FERRAMENTA', 'PRODUTO', 'LOGISTICA', 'OUTROS'];

const fmt = (v: number) => 'R$ ' + v.toFixed(2).replace('.', ',');

export default function FinoraUTMDespesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');
  const [modal, setModal] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    descricao: '', categoria: 'OUTROS', valor: '',
    data: new Date().toISOString().split('T')[0], recorrente: false
  });

  useEffect(() => { carregar(); }, [periodo]);

  const carregar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/despesas?periodo=' + periodo, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setDespesas(data.despesas || []);
        setTotal(data.total || 0);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const salvar = async () => {
    if (!form.descricao || !form.valor) { alert('Preencha descricao e valor'); return; }
    setSalvando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setModal(false);
        setForm({ descricao: '', categoria: 'OUTROS', valor: '', data: new Date().toISOString().split('T')[0], recorrente: false });
        carregar();
      }
    } catch (e) { alert('Erro ao salvar'); }
    setSalvando(false);
  };

  const remover = async (id: string) => {
    if (!confirm('Remover esta despesa?')) return;
    const token = localStorage.getItem('token');
    await fetch('/api/despesas?id=' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    carregar();
  };

  const corCategoria: Record<string, string> = {
    ANUNCIO: 'bg-blue-900 text-blue-300',
    FUNCIONARIO: 'bg-purple-900 text-purple-300',
    FERRAMENTA: 'bg-amber-900 text-amber-300',
    PRODUTO: 'bg-green-900 text-green-300',
    LOGISTICA: 'bg-orange-900 text-orange-300',
    OUTROS: 'bg-gray-700 text-gray-300'
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Despesas</h1>
          <p className="text-gray-500 text-sm">Adicione gastos personalizados para calcular seu lucro real</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 outline-none">
            <option value="mes">Este mes</option>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </select>
          <button onClick={carregar} className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition">
            <Plus size={16} /> Adicionar gasto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Total despesas</div>
          <div className="text-2xl font-bold text-red-400">{fmt(total)}</div>
          <div className="text-gray-500 text-xs mt-1">{despesas.length} lancamentos</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Por categoria</div>
          <div className="space-y-1 mt-2">
            {categorias.map(cat => {
              const total_cat = despesas.filter(d => d.categoria === cat).reduce((acc, d) => acc + d.valor, 0);
              if (total_cat === 0) return null;
              return (
                <div key={cat} className="flex justify-between text-xs">
                  <span className={'px-1.5 py-0.5 rounded text-xs ' + corCategoria[cat]}>{cat}</span>
                  <span className="text-gray-300">{fmt(total_cat)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Recorrentes</div>
          <div className="text-2xl font-bold text-amber-400">
            {fmt(despesas.filter(d => d.recorrente).reduce((acc, d) => acc + d.valor, 0))}
          </div>
          <div className="text-gray-500 text-xs mt-1">{despesas.filter(d => d.recorrente).length} gastos fixos</div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold text-sm">Lancamentos</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Carregando...</div>
        ) : despesas.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Nenhuma despesa no periodo. Clique em Adicionar gasto para comecar.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-5 text-xs text-gray-500 uppercase">Data</th>
                <th className="text-left py-3 px-5 text-xs text-gray-500 uppercase">Descricao</th>
                <th className="text-left py-3 px-5 text-xs text-gray-500 uppercase">Categoria</th>
                <th className="text-right py-3 px-5 text-xs text-gray-500 uppercase">Valor</th>
                <th className="text-center py-3 px-5 text-xs text-gray-500 uppercase">Fixo</th>
                <th className="py-3 px-5"></th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((d, i) => (
                <tr key={i} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-3 px-5 text-gray-400 text-sm">{new Date(d.data).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-5 text-white text-sm">{d.descricao}</td>
                  <td className="py-3 px-5">
                    <span className={'px-2 py-0.5 rounded text-xs ' + (corCategoria[d.categoria] || corCategoria.OUTROS)}>{d.categoria}</span>
                  </td>
                  <td className="py-3 px-5 text-right text-red-400 font-semibold text-sm">{fmt(d.valor)}</td>
                  <td className="py-3 px-5 text-center">
                    {d.recorrente && <span className="px-2 py-0.5 bg-amber-900 text-amber-300 rounded text-xs">Fixo</span>}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button onClick={() => remover(d.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded transition">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-bold text-lg mb-5">Adicionar despesa</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Descricao *</label>
                <input value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})}
                  placeholder="Ex: Facebook Ads, Funcionario, Ferramenta..."
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Categoria</label>
                  <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                    className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none">
                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Valor (R$) *</label>
                  <input type="number" step="0.01" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})}
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Data</label>
                <input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})}
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.recorrente} onChange={e => setForm({...form, recorrente: e.target.checked})}
                  className="w-4 h-4" />
                <span className="text-gray-300 text-sm">Gasto fixo/recorrente</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(false)} className="flex-1 py-2.5 bg-gray-700 text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-600 transition">
                  Cancelar
                </button>
                <button onClick={salvar} disabled={salvando} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50">
                  {salvando ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}