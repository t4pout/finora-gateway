'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Target, RefreshCw } from 'lucide-react';

interface Venda {
  id: string;
  valor: number;
  status: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: string;
}

interface MetricaUTM {
  source: string;
  vendas: number;
  pagas: number;
  receita: number;
}

export default function FinoraUTMDashboard() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30');
  const [metaDados, setMetaDados] = useState<any[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaConectado, setMetaConectado] = useState(false);

  useEffect(() => { carregarVendas(); carregarMetaDados(); }, []);

  const carregarVendas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/vendas', { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) { const data = await res.json(); setVendas(data.vendas || []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const carregarMetaDados = async () => {
    setMetaLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/integracoes/meta/dados?dias=' + periodo, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setMetaDados(data.campanhas || []);
        setMetaConectado(true);
      } else {
        setMetaConectado(false);
      }
    } catch (e) { console.error(e); }
    setMetaLoading(false);
  };

  const diasAtras = (dias: number) => new Date(Date.now() - dias * 86400000);

  const vendasFiltradas = vendas.filter(v => {
    if (periodo === 'hoje') return new Date(v.createdAt) >= diasAtras(1);
    return new Date(v.createdAt) >= diasAtras(parseInt(periodo));
  });

  const vendasComUTM = vendasFiltradas.filter(v => v.utmSource);
  const vendasPagas = vendasFiltradas.filter(v => v.status === 'PAGO');
  const receitaTotal = vendasPagas.reduce((acc, v) => acc + v.valor, 0);
  const receitaRastreada = vendasPagas.filter(v => v.utmSource).reduce((acc, v) => acc + v.valor, 0);

  const metricasPorSource = (): MetricaUTM[] => {
    const mapa = new Map<string, MetricaUTM>();
    vendasComUTM.forEach(v => {
      const key = v.utmSource || 'direto';
      const atual = mapa.get(key) || { source: key, vendas: 0, pagas: 0, receita: 0 };
      atual.vendas++;
      if (v.status === 'PAGO') { atual.pagas++; atual.receita += v.valor; }
      mapa.set(key, atual);
    });
    return Array.from(mapa.values()).sort((a, b) => b.receita - a.receita);
  };

  const metricas = metricasPorSource();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm">Visao geral das suas campanhas</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 outline-none"
          >
            <option value="hoje">Hoje</option>
            <option value="7">Ultimos 7 dias</option>
            <option value="30">Ultimos 30 dias</option>
            <option value="90">Ultimos 90 dias</option>
          </select>
          <button onClick={carregarVendas} className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Receita Total</span>
            <DollarSign size={16} className="text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">R$ {receitaTotal.toFixed(2).replace('.', ',')}</div>
          <div className="text-gray-500 text-xs mt-1">{vendasPagas.length} vendas pagas</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Receita Rastreada</span>
            <Target size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">R$ {receitaRastreada.toFixed(2).replace('.', ',')}</div>
          <div className="text-gray-500 text-xs mt-1">{receitaTotal > 0 ? ((receitaRastreada / receitaTotal) * 100).toFixed(0) : 0}% do total</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Vendas com UTM</span>
            <ShoppingCart size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{vendasComUTM.length}</div>
          <div className="text-gray-500 text-xs mt-1">de {vendasFiltradas.length} no periodo</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Canais Ativos</span>
            <TrendingUp size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{new Set(vendasComUTM.map(v => v.utmSource)).size}</div>
          <div className="text-gray-500 text-xs mt-1">origens diferentes</div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold text-sm">Vendas por origem</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Carregando...</div>
        ) : metricas.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Nenhuma venda com UTM no periodo selecionado</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Origem</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendas</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pagas</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receita</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {metricas.map((m, i) => (
                <tr key={i} className="border-b border-gray-700 hover:bg-gray-750 transition">
                  <td className="py-3 px-5">
                    <span className="px-2 py-1 bg-purple-900 text-purple-300 rounded text-xs font-semibold">{m.source}</span>
                  </td>
                  <td className="py-3 px-5 text-gray-300 text-sm">{m.vendas}</td>
                  <td className="py-3 px-5 text-green-400 text-sm font-semibold">{m.pagas}</td>
                  <td className="py-3 px-5 text-white text-sm font-bold">R$ {m.receita.toFixed(2).replace('.', ',')}</td>
                  <td className="py-3 px-5 text-sm">
                    <span className="text-gray-400">{m.vendas > 0 ? ((m.pagas / m.vendas) * 100).toFixed(0) : 0}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {metaConectado && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-blue-900 rounded flex items-center justify-center text-blue-300 font-bold text-xs">f</div>
              <h2 className="text-white font-semibold text-sm">Campanhas Meta Ads</h2>
            </div>
            <button onClick={carregarMetaDados} className="p-1.5 bg-gray-700 rounded text-gray-400 hover:text-white transition">
              <RefreshCw size={14} />
            </button>
          </div>
          {metaLoading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Buscando campanhas...</div>
          ) : metaDados.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">Nenhuma campanha encontrada no periodo selecionado</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Campanha</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Gasto</th>
                </tr>
              </thead>
              <tbody>
                {metaDados.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-gray-700 hover:bg-gray-750 transition">
                    <td className="py-3 px-5 text-white text-sm">{c.nome}</td>
                    <td className="py-3 px-5">
                      <span className={'px-2 py-0.5 rounded text-xs font-semibold ' + (c.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400')}>
                        {c.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-amber-400 font-semibold text-sm">R$ {c.gasto.toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
