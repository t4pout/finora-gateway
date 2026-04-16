'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';

interface LinhaRelatorio {
  data: string;
  diaSemana: string;
  vendas: number;
  faturamentoBruto: number;
  faturamentoLiquido: number;
  taxas: number;
  despesas: number;
  gastosMeta: number;
  lucro: number;
  roas: number;
  margem: number;
  roi: number;
  cpa: number;
  impressoes: number;
  cliques: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

const fmt = (v: number) => 'R$ ' + v.toFixed(2).replace('.', ',');
const fmtN = (v: number, dec = 2) => v.toFixed(dec).replace('.', ',');

const roasColor = (v: number) => v === 0 ? 'text-gray-500' : v >= 3 ? 'text-green-400' : v >= 2 ? 'text-amber-400' : 'text-red-400';
const lucroColor = (v: number) => v >= 0 ? 'text-green-400' : 'text-red-400';

export default function FinoraUTMRelatorios() {
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('7');
  const [agrupar, setAgrupar] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [totais, setTotais] = useState<Partial<LinhaRelatorio>>({});

  useEffect(() => { carregar(); }, [periodo]);

  const carregar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/finora-utm/relatorio?dias=' + periodo, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setLinhas(data.linhas || []);
        setTotais(data.totais || {});
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const exportarCSV = () => {
    const headers = ['Data', 'Vendas', 'CPA', 'Gastos', 'Despesas', 'Fat. Bruto', 'Fat. Liquido', 'Lucro', 'ROAS', 'Margem', 'ROI', 'Impressoes', 'Cliques', 'CTR', 'CPC', 'CPM'];
    const rows = linhas.map(l => [
      l.data, l.vendas, l.cpa.toFixed(2), l.gastosMeta.toFixed(2), l.despesas.toFixed(2),
      l.faturamentoBruto.toFixed(2), l.faturamentoLiquido.toFixed(2), l.lucro.toFixed(2),
      l.roas.toFixed(2), l.margem.toFixed(2), l.roi.toFixed(2),
      l.impressoes, l.cliques, l.ctr.toFixed(2), l.cpc.toFixed(2), l.cpm.toFixed(2)
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'relatorio-finora-utm.csv'; a.click();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Relatorios</h1>
          <p className="text-gray-500 text-sm">Analise diaria de performance das campanhas</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 outline-none">
            <option value="7">7 dias</option>
            <option value="14">14 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </select>
          <button onClick={carregar} className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportarCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition">
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      {Object.keys(totais).length > 0 && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Fat. Liquido</div>
            <div className="text-xl font-bold text-white">{fmt(totais.faturamentoLiquido || 0)}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Gastos</div>
            <div className="text-xl font-bold text-amber-400">{fmt(totais.gastosMeta || 0)}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Lucro</div>
            <div className={'text-xl font-bold ' + lucroColor(totais.lucro || 0)}>{fmt(totais.lucro || 0)}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">ROAS medio</div>
            <div className={'text-xl font-bold ' + roasColor(totais.roas || 0)}>
              {(totais.roas || 0) > 0 ? fmtN(totais.roas || 0) + 'x' : 'N/A'}
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Vendas totais</div>
            <div className="text-xl font-bold text-white">{totais.vendas || 0}</div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Relatorio por dia</h2>
          <span className="text-gray-500 text-xs">{linhas.length} dias</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Carregando...</div>
        ) : linhas.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Nenhum dado no periodo selecionado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{minWidth: '1400px'}}>
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase sticky left-0 bg-gray-800">Data</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Vendas</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPA</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Gastos</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Despesas</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Fat. Bruto</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Fat. Liquido</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Lucro</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">ROAS</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Margem</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">ROI</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Impressoes</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Cliques</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CTR</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPC</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPM</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => (
                  <tr key={i} className="border-b border-gray-700 hover:bg-gray-750 transition">
                    <td className="py-3 px-4 sticky left-0 bg-gray-800">
                      <div className="text-white text-xs font-medium">{l.data}</div>
                      <div className="text-gray-500 text-xs">{l.diaSemana}</div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300 text-xs">{l.vendas}</td>
                    <td className="py-3 px-4 text-right text-gray-400 text-xs">{l.cpa > 0 ? fmt(l.cpa) : 'N/A'}</td>
                    <td className="py-3 px-4 text-right text-amber-400 text-xs">{l.gastosMeta > 0 ? fmt(l.gastosMeta) : '-'}</td>
                    <td className="py-3 px-4 text-right text-red-400 text-xs">{l.despesas > 0 ? fmt(l.despesas) : '-'}</td>
                    <td className="py-3 px-4 text-right text-gray-400 text-xs">{fmt(l.faturamentoBruto)}</td>
                    <td className="py-3 px-4 text-right text-white text-xs">{fmt(l.faturamentoLiquido)}</td>
                    <td className={'py-3 px-4 text-right text-xs font-semibold ' + lucroColor(l.lucro)}>{fmt(l.lucro)}</td>
                    <td className={'py-3 px-4 text-right text-xs font-bold ' + roasColor(l.roas)}>{l.roas > 0 ? fmtN(l.roas) + 'x' : 'N/A'}</td>
                    <td className={'py-3 px-4 text-right text-xs ' + roasColor(l.margem)}>{l.margem > 0 ? fmtN(l.margem) + '%' : 'N/A'}</td>
                    <td className={'py-3 px-4 text-right text-xs ' + roasColor(l.roi)}>{l.roi > 0 ? fmtN(l.roi) + 'x' : 'N/A'}</td>
                    <td className="py-3 px-4 text-right text-gray-400 text-xs">{l.impressoes > 0 ? l.impressoes.toLocaleString('pt-BR') : '-'}</td>
                    <td className="py-3 px-4 text-right text-gray-400 text-xs">{l.cliques > 0 ? l.cliques.toLocaleString('pt-BR') : '-'}</td>
                    <td className="py-3 px-4 text-right text-gray-400 text-xs">{l.ctr > 0 ? fmtN(l.ctr) + '%' : '-'}</td>
                    <td className="py-3 px-4 text-right text-gray-400 text-xs">{l.cpc > 0 ? fmt(l.cpc) : '-'}</td>
                    <td className="py-3 px-4 text-right text-gray-400 text-xs">{l.cpm > 0 ? fmt(l.cpm) : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-600 bg-gray-750">
                  <td className="py-3 px-4 text-white text-xs font-bold sticky left-0 bg-gray-800">TOTAL</td>
                  <td className="py-3 px-4 text-right text-white text-xs font-bold">{totais.vendas || 0}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">{(totais.cpa || 0) > 0 ? fmt(totais.cpa || 0) : 'N/A'}</td>
                  <td className="py-3 px-4 text-right text-amber-400 text-xs font-bold">{fmt(totais.gastosMeta || 0)}</td>
                  <td className="py-3 px-4 text-right text-red-400 text-xs font-bold">{fmt(totais.despesas || 0)}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs font-bold">{fmt(totais.faturamentoBruto || 0)}</td>
                  <td className="py-3 px-4 text-right text-white text-xs font-bold">{fmt(totais.faturamentoLiquido || 0)}</td>
                  <td className={'py-3 px-4 text-right text-xs font-bold ' + lucroColor(totais.lucro || 0)}>{fmt(totais.lucro || 0)}</td>
                  <td className={'py-3 px-4 text-right text-xs font-bold ' + roasColor(totais.roas || 0)}>{(totais.roas || 0) > 0 ? fmtN(totais.roas || 0) + 'x' : 'N/A'}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">-</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">-</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs font-bold">{(totais.impressoes || 0).toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs font-bold">{(totais.cliques || 0).toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">-</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">-</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
