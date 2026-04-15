'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

interface Venda {
  id: string;
  valor: number;
  status: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: string;
  compradorNome: string;
  produto: { nome: string };
}

export default function FinoraUTMRelatorios() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [agrupar, setAgrupar] = useState<'source' | 'medium' | 'campaign'>('source');
  const [periodo, setPeriodo] = useState('30');

  useEffect(() => { carregarVendas(); }, []);

  const carregarVendas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/vendas', { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) { const d = await res.json(); setVendas(d.vendas || []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const vendasFiltradas = vendas.filter(v => {
    const dias = periodo === 'hoje' ? 1 : parseInt(periodo);
    return new Date(v.createdAt) >= new Date(Date.now() - dias * 86400000);
  });

  const vendasComUTM = vendasFiltradas.filter(v => v.utmSource);
  const totalReceita = vendasFiltradas.filter(v => v.status === 'PAGO').reduce((acc, v) => acc + v.valor, 0);

  const gerarRelatorio = () => {
    const mapa = new Map<string, { chave: string; vendas: number; pagas: number; receita: number }>();
    vendasComUTM.forEach(v => {
      const chave = agrupar === 'source' ? (v.utmSource || '') : agrupar === 'medium' ? (v.utmMedium || '(sem medium)') : (v.utmCampaign || '(sem campaign)');
      const atual = mapa.get(chave) || { chave, vendas: 0, pagas: 0, receita: 0 };
      atual.vendas++;
      if (v.status === 'PAGO') { atual.pagas++; atual.receita += v.valor; }
      mapa.set(chave, atual);
    });
    return Array.from(mapa.values()).sort((a, b) => b.receita - a.receita);
  };

  const relatorio = gerarRelatorio();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Relatorios UTM</h1>
          <p className="text-gray-500 text-sm">Analise o desempenho das suas campanhas</p>
        </div>
        <div className="flex gap-3">
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 outline-none">
            <option value="hoje">Hoje</option>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Receita total</div>
          <div className="text-2xl font-bold text-white">R$ {totalReceita.toFixed(2).replace('.', ',')}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Vendas com UTM</div>
          <div className="text-2xl font-bold text-purple-400">{vendasComUTM.length}</div>
          <div className="text-gray-500 text-xs mt-1">de {vendasFiltradas.length} no periodo</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Canais ativos</div>
          <div className="text-2xl font-bold text-amber-400">{new Set(vendasComUTM.map(v => v.utmSource)).size}</div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Agrupar por</h2>
          <div className="flex gap-2">
            {(['source', 'medium', 'campaign'] as const).map(tipo => (
              <button key={tipo} onClick={() => setAgrupar(tipo)}
                className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition ' + (agrupar === tipo ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600')}>
                {tipo === 'source' ? 'Source' : tipo === 'medium' ? 'Medium' : 'Campaign'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Carregando...</div>
        ) : relatorio.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 size={40} className="mx-auto text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">Nenhum dado UTM no periodo selecionado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">{agrupar === 'source' ? 'Origem' : agrupar === 'medium' ? 'Midia' : 'Campanha'}</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Vendas</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Pagas</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Receita</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Conversao</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">% Receita</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.map((row, i) => (
                <tr key={i} className="border-b border-gray-700 hover:bg-gray-750 transition">
                  <td className="py-3 px-5">
                    <span className="px-2 py-1 bg-purple-900 text-purple-300 rounded text-xs font-semibold">{row.chave}</span>
                  </td>
                  <td className="py-3 px-5 text-gray-300 text-sm">{row.vendas}</td>
                  <td className="py-3 px-5 text-green-400 text-sm font-semibold">{row.pagas}</td>
                  <td className="py-3 px-5 text-white text-sm font-bold">R$ {row.receita.toFixed(2).replace('.', ',')}</td>
                  <td className="py-3 px-5 text-sm text-gray-400">{row.vendas > 0 ? ((row.pagas / row.vendas) * 100).toFixed(0) : 0}%</td>
                  <td className="py-3 px-5 text-sm text-purple-400">{totalReceita > 0 ? ((row.receita / totalReceita) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}