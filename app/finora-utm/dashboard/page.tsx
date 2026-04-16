'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, DollarSign, ShoppingCart, Target, BarChart3, CreditCard } from 'lucide-react';

interface Resumo {
  totalDespesas: number;
  faturamentoBruto: number;
  faturamentoLiquido: number;
  totalTaxas: number;
  gastosMeta: number;
  lucro: number;
  roas: number;
  margem: number;
  cpa: number;
  totalVendas: number;
  vendasPendentes: number;
  totalVendasPendentes: number;
  vendasPix: number;
  vendasCartao: number;
  vendasBoleto: number;
  receitaPix: number;
  receitaCartao: number;
  receitaBoleto: number;
  planoTaxa: { nome: string; pixPercentual: number; cartaoPercentual: number } | null;
}

interface CampanhaMeta {
  id: string;
  nome: string;
  status: string;
  gasto: number;
  impressoes: number;
  cliques: number;
  cpc: number;
  cpm: number;
  ctr: number;
  vendas: number;
  faturamentoBruto: number;
  faturamentoLiquido: number;
  taxas: number;
  lucro: number;
  roas: number;
  margem: number;
  cpa: number;
}

interface PorCampanha {
  campanha: string;
  vendas: number;
  faturamentoBruto: number;
  faturamentoLiquido: number;
  taxas: number;
}

const fmt = (v: number) => 'R$ ' + v.toFixed(2).replace('.', ',');
const fmtN = (v: number) => v.toFixed(2).replace('.', ',');

export default function FinoraUTMDashboard() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [campanhasMeta, setCampanhasMeta] = useState<CampanhaMeta[]>([]);
  const [porCampanha, setPorCampanha] = useState<PorCampanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('hoje');
  const [abaAtiva, setAbaAtiva] = useState<'resumo' | 'meta' | 'campanhas'>('resumo');

  useEffect(() => { carregar(); }, [periodo]);

  const carregar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/finora-utm?dias=' + periodo, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setResumo(data.resumo);
        setCampanhasMeta(data.campanhasMeta || []);
        setPorCampanha(data.porCampanha || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const roasColor = (roas: number) => {
    if (roas === 0) return 'text-gray-400';
    if (roas >= 3) return 'text-green-400';
    if (roas >= 2) return 'text-amber-400';
    return 'text-red-400';
  };

  const margemColor = (m: number) => {
    if (m >= 50) return 'text-green-400';
    if (m >= 30) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm">
            {resumo?.planoTaxa ? 'Plano de taxa: ' + resumo.planoTaxa.nome : 'Taxas padrao da plataforma'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 outline-none">
            <option value="hoje">Hoje</option>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </select>
          <button onClick={carregar} className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Carregando dados...</div>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Faturamento liquido</div>
              <div className="text-2xl font-bold text-white">{fmt(resumo?.faturamentoLiquido || 0)}</div>
              <div className="text-gray-500 text-xs mt-1">Bruto: {fmt(resumo?.faturamentoBruto || 0)}</div>
              <div className="text-gray-600 text-xs">Taxas: {fmt(resumo?.totalTaxas || 0)}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Gastos anuncios</div>
              <div className="text-2xl font-bold text-amber-400">{fmt(resumo?.gastosMeta || 0)}</div>
              <div className="text-gray-500 text-xs mt-1">Meta Ads</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Despesas adicionais</div>
              <div className="text-2xl font-bold text-red-400">{fmt(resumo?.totalDespesas || 0)}</div>
              <div className="text-gray-500 text-xs mt-1">Gastos lancados</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">ROAS</div>
              <div className={'text-2xl font-bold ' + roasColor(resumo?.roas || 0)}>
                {resumo?.roas ? fmtN(resumo.roas) + 'x' : 'N/A'}
              </div>
              <div className="text-gray-500 text-xs mt-1">Retorno sobre gasto</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Lucro</div>
              <div className={'text-2xl font-bold ' + ((resumo?.lucro || 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                {fmt(resumo?.lucro || 0)}
              </div>
              <div className={'text-xs mt-1 ' + margemColor(resumo?.margem || 0)}>
                Margem: {resumo?.margem ? fmtN(resumo.margem) + '%' : 'N/A'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Vendas pagas</div>
              <div className="text-2xl font-bold text-white">{resumo?.totalVendas || 0}</div>
              <div className="text-gray-500 text-xs mt-1">CPA: {resumo?.cpa ? fmt(resumo.cpa) : 'N/A'}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Vendas pendentes</div>
              <div className="text-2xl font-bold text-amber-400">{resumo?.vendasPendentes || 0}</div>
              <div className="text-gray-500 text-xs mt-1">{fmt(resumo?.totalVendasPendentes || 0)}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">ROI</div>
              <div className={'text-2xl font-bold ' + roasColor(resumo?.roas || 0)}>
                {resumo?.roas ? fmtN(resumo.roas) + 'x' : 'N/A'}
              </div>
              <div className="text-gray-500 text-xs mt-1">Retorno sobre investimento</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Por metodo</div>
              <div className="space-y-1 mt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-400">PIX ({resumo?.vendasPix || 0})</span>
                  <span className="text-gray-300">{fmt(resumo?.receitaPix || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-purple-400">Cartao ({resumo?.vendasCartao || 0})</span>
                  <span className="text-gray-300">{fmt(resumo?.receitaCartao || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-amber-400">Boleto ({resumo?.vendasBoleto || 0})</span>
                  <span className="text-gray-300">{fmt(resumo?.receitaBoleto || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {(['resumo', 'meta', 'campanhas'] as const).map(aba => (
              <button key={aba} onClick={() => setAbaAtiva(aba)}
                className={'px-4 py-2 rounded-lg text-sm font-semibold transition ' + (abaAtiva === aba ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
                {aba === 'resumo' ? 'Por origem' : aba === 'meta' ? 'Meta Ads' : 'Por campanha UTM'}
              </button>
            ))}
          </div>

          {abaAtiva === 'resumo' && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-700">
                <h2 className="text-white font-semibold text-sm">Vendas por origem (utm_source)</h2>
              </div>
              {porCampanha.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">Nenhuma venda com UTM no periodo</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-5 text-xs text-gray-500 uppercase">Campanha UTM</th>
                      <th className="text-left py-3 px-5 text-xs text-gray-500 uppercase">Vendas</th>
                      <th className="text-left py-3 px-5 text-xs text-gray-500 uppercase">Fat. Bruto</th>
                      <th className="text-left py-3 px-5 text-xs text-gray-500 uppercase">Taxas</th>
                      <th className="text-left py-3 px-5 text-xs text-gray-500 uppercase">Fat. Liquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porCampanha.map((c, i) => (
                      <tr key={i} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="py-3 px-5">
                          <span className="px-2 py-1 bg-purple-900 text-purple-300 rounded text-xs">{c.campanha}</span>
                        </td>
                        <td className="py-3 px-5 text-gray-300 text-sm">{c.vendas}</td>
                        <td className="py-3 px-5 text-gray-400 text-sm">{fmt(c.faturamentoBruto)}</td>
                        <td className="py-3 px-5 text-red-400 text-sm">-{fmt(c.taxas)}</td>
                        <td className="py-3 px-5 text-white font-semibold text-sm">{fmt(c.faturamentoLiquido)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {abaAtiva === 'meta' && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-800 rounded flex items-center justify-center text-blue-300 font-bold text-xs">f</div>
                <h2 className="text-white font-semibold text-sm">Campanhas Meta Ads</h2>
              </div>
              {campanhasMeta.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {resumo ? 'Nenhuma campanha Meta encontrada no periodo' : 'Meta Ads nao conectado'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" style={{minWidth: '1200px'}}>
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase">Campanha</th>
                        <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase">Status</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Vendas</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Gasto</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Fat. Liquido</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Lucro</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">ROAS</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Margem</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPA</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Impressoes</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Cliques</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CTR</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPC</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campanhasMeta.map((c, i) => (
                        <tr key={i} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="py-3 px-4 text-white text-xs max-w-48 truncate">{c.nome}</td>
                          <td className="py-3 px-4">
                            <span className={'px-2 py-0.5 rounded text-xs ' + (c.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400')}>
                              {c.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-300 text-xs">{c.vendas}</td>
                          <td className="py-3 px-4 text-right text-amber-400 text-xs">{fmt(c.gasto)}</td>
                          <td className="py-3 px-4 text-right text-white text-xs">{fmt(c.faturamentoLiquido)}</td>
                          <td className={'py-3 px-4 text-right text-xs font-semibold ' + (c.lucro >= 0 ? 'text-green-400' : 'text-red-400')}>{fmt(c.lucro)}</td>
                          <td className={'py-3 px-4 text-right text-xs font-bold ' + roasColor(c.roas)}>{c.roas > 0 ? fmtN(c.roas) + 'x' : 'N/A'}</td>
                          <td className={'py-3 px-4 text-right text-xs ' + margemColor(c.margem)}>{c.margem > 0 ? fmtN(c.margem) + '%' : 'N/A'}</td>
                          <td className="py-3 px-4 text-right text-gray-300 text-xs">{c.cpa > 0 ? fmt(c.cpa) : 'N/A'}</td>
                          <td className="py-3 px-4 text-right text-gray-400 text-xs">{c.impressoes.toLocaleString('pt-BR')}</td>
                          <td className="py-3 px-4 text-right text-gray-400 text-xs">{c.cliques.toLocaleString('pt-BR')}</td>
                          <td className="py-3 px-4 text-right text-gray-400 text-xs">{fmtN(c.ctr)}%</td>
                          <td className="py-3 px-4 text-right text-gray-400 text-xs">{fmt(c.cpc)}</td>
                          <td className="py-3 px-4 text-right text-gray-400 text-xs">{fmt(c.cpm)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {abaAtiva === 'campanhas' && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-700">
                <h2 className="text-white font-semibold text-sm">Por campanha UTM (utm_campaign)</h2>
              </div>
              {porCampanha.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">Nenhuma venda com utm_campaign no periodo</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-5 text-xs text-gray-500 uppercase">utm_campaign</th>
                      <th className="text-right py-3 px-5 text-xs text-gray-500 uppercase">Vendas</th>
                      <th className="text-right py-3 px-5 text-xs text-gray-500 uppercase">Fat. Bruto</th>
                      <th className="text-right py-3 px-5 text-xs text-gray-500 uppercase">Taxas</th>
                      <th className="text-right py-3 px-5 text-xs text-gray-500 uppercase">Fat. Liquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porCampanha.map((c, i) => (
                      <tr key={i} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="py-3 px-5">
                          <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">{c.campanha}</span>
                        </td>
                        <td className="py-3 px-5 text-right text-gray-300 text-sm">{c.vendas}</td>
                        <td className="py-3 px-5 text-right text-gray-400 text-sm">{fmt(c.faturamentoBruto)}</td>
                        <td className="py-3 px-5 text-right text-red-400 text-sm">-{fmt(c.taxas)}</td>
                        <td className="py-3 px-5 text-right text-white font-semibold text-sm">{fmt(c.faturamentoLiquido)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
