'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ItemMeta {
  id: string;
  nome: string;
  status: string;
  gasto: number;
  impressoes: number;
  cliques: number;
  cpc: number;
  cpm: number;
  ctr: number;
  alcance: number;
  frequencia: number;
  vendasFinora: number;
  receitaFinora: number;
  lucro: number;
  roas: number;
  cpa: number;
  margem: number;
  roi: number;
  ic: number;
  cpi: number;
  orcamentoDiario?: number;
  objetivo?: string;
  thumbnail?: string;
  moeda?: string;
  totalGasto?: number;
  saldo?: number;
}

const fmt = (v: number) => 'R\$ ' + v.toFixed(2).replace('.', ',');
const fmtN = (v: number, d = 2) => v.toFixed(d).replace('.', ',');
const na = (v: number, fn: () => string) => v > 0 ? fn() : 'N/A';
const roasColor = (v: number) => v === 0 ? 'text-gray-500' : v >= 3 ? 'text-green-400' : v >= 2 ? 'text-amber-400' : 'text-red-400';
const lucroColor = (v: number) => v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-gray-500';
const statusBadge = (s: string) => s === 'ACTIVE' ? 'bg-green-900 text-green-300' : s === 'PAUSED' ? 'bg-amber-900 text-amber-300' : 'bg-gray-700 text-gray-400';
const statusText = (s: string) => s === 'ACTIVE' ? 'Ativo' : s === 'PAUSED' ? 'Pausado' : s === 'ARCHIVED' ? 'Arquivado' : s;

type Nivel = 'contas' | 'campanhas' | 'conjuntos' | 'anuncios';

const NIVEL_LABELS: Record<Nivel, string> = { contas: 'Contas', campanhas: 'Campanhas', conjuntos: 'Conjuntos', anuncios: 'Anuncios' };
const NIVEL_COL: Record<Nivel, string> = { contas: 'CONTA', campanhas: 'CAMPANHA', conjuntos: 'CONJUNTO', anuncios: 'ANUNCIO' };

export default function FinoraUTMMeta() {
  const [nivel, setNivel] = useState<Nivel>('contas');
  const [itens, setItens] = useState<ItemMeta[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState<ItemMeta | null>(null);
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<ItemMeta | null>(null);
  const [conjuntoSelecionado, setConjuntoSelecionado] = useState<ItemMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [semConta, setSemConta] = useState(false);
  const [erro, setErro] = useState('');
  const [periodo, setPeriodo] = useState('30');
  const [accountNome, setAccountNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [contasDisponiveis, setContasDisponiveis] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [filtroProduto, setFiltroProduto] = useState('');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState('');

  useEffect(() => { verificarConexao(); carregarProdutos(); }, []);

  const carregarProdutos = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/produtos', { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.ok) { const d = await res.json(); setProdutos(d.produtos || []); }
  };

  const verificarConexao = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/integracoes/meta/contas', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) { setConectado(false); return; }
      const data = await res.json();
      setConectado(true);
      if (data.contas?.length > 0) {
        setContasDisponiveis(data.contas);
        if (data.contas.length === 1) await selecionarConta(data.contas[0].id, data.contas[0].name);
        else carregarDados('contas');
      } else { setSemConta(true); }
    } catch { setConectado(false); }
  };

  const selecionarConta = async (id: string, nome: string) => {
    const token = localStorage.getItem('token');
    await fetch('/api/integracoes/meta/contas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ accountId: id, accountNome: nome })
    });
    setAccountNome(nome);
    setContasDisponiveis([]);
    setSemConta(false);
    carregarDados('campanhas');
  };

  const carregarDados = async (n: Nivel, parentId?: string) => {
    setLoading(true);
    setErro('');
    setBusca('');
    setFiltroStatus('');
    const token = localStorage.getItem('token');
    let url = '/api/integracoes/meta/gerenciador?nivel=' + n + '&dias=' + periodo;
    if (n === 'conjuntos' && parentId) url += '&campanhaId=' + parentId;
    if (n === 'anuncios' && parentId) url += '&conjuntoId=' + parentId;
    try {
      const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      if (data.erro) { setErro(data.erro); setLoading(false); return; }
      const lista = data.contas || data.campanhas || data.conjuntos || data.anuncios || [];
      setItens(lista);
      setNivel(n);
      if (data.accountNome) setAccountNome(data.accountNome);
      setUltimaAtualizacao(new Date().toLocaleTimeString('pt-BR'));
    } catch { setErro('Erro ao carregar dados'); }
    setLoading(false);
  };

  const itensFiltrados = itens.filter(i => {
    if (filtroStatus && i.status !== filtroStatus) return false;
    if (busca && !i.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const totais = itensFiltrados.reduce((acc, i) => ({
    vendas: acc.vendas + i.vendasFinora,
    gasto: acc.gasto + i.gasto,
    faturamento: acc.faturamento + i.receitaFinora,
    lucro: acc.lucro + i.lucro,
    impressoes: acc.impressoes + i.impressoes,
    cliques: acc.cliques + i.cliques,
  }), { vendas: 0, gasto: 0, faturamento: 0, lucro: 0, impressoes: 0, cliques: 0 });

  const roasTotal = totais.gasto > 0 ? totais.faturamento / totais.gasto : 0;
  const cpaTotal = totais.vendas > 0 ? totais.gasto / totais.vendas : 0;
  const margemTotal = totais.faturamento > 0 ? (totais.lucro / totais.faturamento) * 100 : 0;

  const abaClass = (n: Nivel) =>
    'flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition -mb-px ' +
    (nivel === n ? 'border-blue-500 text-white bg-gray-800' : 'border-transparent text-gray-500 hover:text-gray-300 bg-transparent');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-700 rounded flex items-center justify-center text-white font-bold text-xs">f</div>
          <div>
            <h1 className="text-base font-bold text-white">{accountNome || 'Meta Ads'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ultimaAtualizacao && <span className="text-gray-500 text-xs">Atualizado {ultimaAtualizacao}</span>}
          <button onClick={() => carregarDados(nivel, nivel === 'conjuntos' ? campanhaSelecionada?.id : nivel === 'anuncios' ? conjuntoSelecionado?.id : undefined)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition flex items-center gap-2">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>
      </div>

      {!conectado && (
        <div className="mx-6 mt-4 bg-red-950 border border-red-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <div>
              <div className="text-red-300 font-semibold text-sm">Voce precisa conectar o Meta Ads</div>
              <div className="text-red-400 text-xs mt-0.5">Conecte sua conta para acessar os dados das campanhas</div>
            </div>
          </div>
          <Link href="/finora-utm/integracoes">
            <button className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition">Conectar agora</button>
          </Link>
        </div>
      )}

      {conectado && semConta && (
        <div className="mx-6 mt-4 bg-amber-950 border border-amber-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-400 shrink-0" />
            <div>
              <div className="text-amber-300 font-semibold text-sm">Nenhuma conta de anuncio encontrada</div>
              <div className="text-amber-400 text-xs mt-0.5">O perfil conectado nao tem contas de anuncio. Reconecte com o perfil admin da BM.</div>
            </div>
          </div>
          <Link href="/finora-utm/integracoes">
            <button className="px-4 py-2 bg-amber-700 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition">Reconectar</button>
          </Link>
        </div>
      )}

      {contasDisponiveis.length > 1 && (
        <div className="mx-6 mt-4 bg-gray-800 border border-blue-700 rounded-xl p-5">
          <div className="text-blue-300 font-semibold text-sm mb-3">Selecione a conta de anuncios</div>
          <div className="space-y-2">
            {contasDisponiveis.map((c: any) => (
              <button key={c.id} onClick={() => selecionarConta(c.id, c.name)}
                className="w-full text-left px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                <div className="text-white text-sm font-medium">{c.name}</div>
                <div className="text-gray-400 text-xs">{c.id} — {c.currency}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {erro && (
        <div className="mx-6 mt-4 bg-red-950 border border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <div>
            <div className="text-red-300 font-semibold text-sm">Erro ao carregar dados do Meta</div>
            <div className="text-red-400 text-xs mt-1">{erro}</div>
          </div>
        </div>
      )}

      <div className="flex border-b border-gray-800 px-6 mt-4">
        {(['contas', 'campanhas', 'conjuntos', 'anuncios'] as Nivel[]).map(n => (
          <button key={n} onClick={() => {
            if (n === 'contas') { carregarDados('contas'); setContaSelecionada(null); setCampanhaSelecionada(null); setConjuntoSelecionado(null); }
            else if (n === 'campanhas') { carregarDados('campanhas'); setCampanhaSelecionada(null); setConjuntoSelecionado(null); }
            else if (n === 'conjuntos' && campanhaSelecionada) { carregarDados('conjuntos', campanhaSelecionada.id); setConjuntoSelecionado(null); }
            else if (n === 'anuncios' && conjuntoSelecionado) carregarDados('anuncios', conjuntoSelecionado.id);
          }}
            disabled={(n === 'conjuntos' && !campanhaSelecionada) || (n === 'anuncios' && !conjuntoSelecionado)}
            className={abaClass(n) + ((n === 'conjuntos' && !campanhaSelecionada) || (n === 'anuncios' && !conjuntoSelecionado) ? ' opacity-40 cursor-not-allowed' : '')}>
            {n === 'contas' ? '🏢' : n === 'campanhas' ? '📢' : n === 'conjuntos' ? '👥' : '🖼'} {NIVEL_LABELS[n]}
          </button>
        ))}
      </div>

      <div className="px-6 py-3 border-b border-gray-800 grid grid-cols-5 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nome {nivel === 'contas' ? 'da Conta' : nivel === 'campanhas' ? 'da Campanha' : nivel === 'conjuntos' ? 'do Conjunto' : 'do Anuncio'}</label>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Filtrar por nome..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-xs outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-xs outline-none">
            <option value="">Qualquer</option>
            <option value="ACTIVE">Ativo</option>
            <option value="PAUSED">Pausado</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Periodo de Visualizacao</label>
          <select value={periodo} onChange={e => { setPeriodo(e.target.value); }}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-xs outline-none">
            <option value="1">Hoje</option>
            <option value="2">Ontem</option>
            <option value="7">Ultimos 7 dias</option>
            <option value="30">Esse mes</option>
            <option value="60">Mes passado</option>
            <option value="90">Ultimos 90 dias</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Conta de Anuncio</label>
          <select className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-xs outline-none">
            <option>Qualquer</option>
            {accountNome && <option value={accountNome}>{accountNome}</option>}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Produto</label>
          <select value={filtroProduto} onChange={e => setFiltroProduto(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-xs outline-none">
            <option value="">Qualquer</option>
            {produtos.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full" style={{minWidth: '1400px'}}>
          <thead className="sticky top-0 bg-gray-900 z-10">
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase w-8"><input type="checkbox" className="w-3 h-3" /></th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase">STATUS</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase">{NIVEL_COL[nivel]}</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">ORCAMENTO</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">VENDAS</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPA</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">GASTOS</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">FATURAMENTO</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">LUCRO</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">ROAS</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">MARGEM</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">ROI</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">IC</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPI</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPC</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CTR</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPM</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">IMPRESSOES</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CLIQUES</th>
            </tr>
            <tr className="border-b border-gray-800 bg-gray-850">
              <td className="py-2 px-4"></td>
              <td className="py-2 px-4 text-xs text-gray-500">N/A</td>
              <td className="py-2 px-4 text-xs text-gray-400 font-semibold">{itensFiltrados.length} {NIVEL_LABELS[nivel].toUpperCase()}</td>
              <td className="py-2 px-4 text-right text-xs text-gray-400">{fmt(0)}</td>
              <td className="py-2 px-4 text-right text-xs text-gray-400">{totais.vendas}</td>
              <td className="py-2 px-4 text-right text-xs text-gray-400">{cpaTotal > 0 ? fmt(cpaTotal) : 'N/A'}</td>
              <td className="py-2 px-4 text-right text-xs text-amber-400">{fmt(totais.gasto)}</td>
              <td className="py-2 px-4 text-right text-xs text-white">{fmt(totais.faturamento)}</td>
              <td className={'py-2 px-4 text-right text-xs font-semibold ' + lucroColor(totais.lucro)}>{fmt(totais.lucro)}</td>
              <td className={'py-2 px-4 text-right text-xs font-bold ' + roasColor(roasTotal)}>{roasTotal > 0 ? fmtN(roasTotal) + 'x' : 'N/A'}</td>
              <td className={'py-2 px-4 text-right text-xs ' + roasColor(margemTotal)}>{margemTotal > 0 ? fmtN(margemTotal) + '%' : 'N/A'}</td>
              <td className="py-2 px-4 text-right text-xs text-gray-400">N/A</td>
              <td className="py-2 px-4 text-right text-xs text-gray-400">{totais.cliques > 0 ? totais.cliques : 0}</td>
              <td className="py-2 px-4 text-right text-xs text-gray-400">N/A</td>
              <td className="py-2 px-4 text-right text-xs text-gray-400">N/A</td>
              <td className="py-2 px-4 text-right text-xs text-gray-400">0,00%</td>
              <td className="py-2 px-4 text-right text-xs text-gray-400">{fmt(0)}</td>
              <td className="py-2 px-4 text-right text-xs text-gray-400">{totais.impressoes.toLocaleString('pt-BR')}</td>
              <td className="py-2 px-4 text-right text-xs text-gray-400">{totais.cliques.toLocaleString('pt-BR')}</td>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={19} className="py-12 text-center text-gray-500 text-sm">Carregando {NIVEL_LABELS[nivel].toLowerCase()}...</td></tr>
            ) : itensFiltrados.length === 0 ? (
              <tr><td colSpan={19} className="py-12 text-center text-gray-500 text-sm">
                {!conectado || semConta ? 'Conecte o Meta Ads para ver os dados' : '0 ' + NIVEL_LABELS[nivel].toUpperCase()}
              </td></tr>
            ) : itensFiltrados.map((item, i) => {
              const roi = item.gasto > 0 ? item.receitaFinora / item.gasto : 0;
              return (
                <tr key={i}
                  className={'border-b border-gray-800 transition ' + (nivel !== 'anuncios' ? 'hover:bg-gray-800 cursor-pointer' : 'hover:bg-gray-800')}
                  onClick={() => {
                    if (nivel === 'contas') { setContaSelecionada(item); carregarDados('campanhas'); }
                    else if (nivel === 'campanhas') { setCampanhaSelecionada(item); carregarDados('conjuntos', item.id); }
                    else if (nivel === 'conjuntos') { setConjuntoSelecionado(item); carregarDados('anuncios', item.id); }
                  }}>
                  <td className="py-3 px-4"><input type="checkbox" className="w-3 h-3" onClick={e => e.stopPropagation()} /></td>
                  <td className="py-3 px-4">
                    <span className={'px-2 py-0.5 rounded text-xs ' + statusBadge(item.status)}>{statusText(item.status)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {nivel === 'anuncios' && item.thumbnail && <img src={item.thumbnail} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />}
                      <span className="text-white text-xs font-medium max-w-xs truncate">{item.nome}</span>
                      {nivel !== 'anuncios' && <ChevronRight size={12} className="text-gray-600 flex-shrink-0" />}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">{(item.orcamentoDiario || 0) > 0 ? fmt(item.orcamentoDiario || 0) : 'R$ 0,00'}</td>
                  <td className="py-3 px-4 text-right text-gray-300 text-xs">{item.vendasFinora}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cpa > 0 ? fmt(item.cpa) : 'N/A'}</td>
                  <td className="py-3 px-4 text-right text-amber-400 text-xs">{item.gasto > 0 ? fmt(item.gasto) : 'R$ 0,00'}</td>
                  <td className="py-3 px-4 text-right text-white text-xs">{fmt(item.receitaFinora)}</td>
                  <td className={'py-3 px-4 text-right text-xs font-semibold ' + lucroColor(item.lucro)}>{fmt(item.lucro)}</td>
                  <td className={'py-3 px-4 text-right text-xs font-bold ' + roasColor(item.roas)}>{item.roas > 0 ? fmtN(item.roas) + 'x' : 'N/A'}</td>
                  <td className={'py-3 px-4 text-right text-xs ' + roasColor(item.margem)}>{item.margem > 0 ? fmtN(item.margem) + '%' : 'N/A'}</td>
                  <td className={'py-3 px-4 text-right text-xs ' + roasColor(roi)}>{roi > 0 ? fmtN(roi) + 'x' : 'N/A'}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cliques > 0 ? item.cliques : 0}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">N/A</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cpc > 0 ? fmt(item.cpc) : 'N/A'}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.ctr > 0 ? fmtN(item.ctr) + '%' : '0,00%'}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cpm > 0 ? fmt(item.cpm) : 'R$ 0,00'}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.impressoes > 0 ? item.impressoes.toLocaleString('pt-BR') : '0'}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cliques > 0 ? item.cliques.toLocaleString('pt-BR') : '0'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {nivel === 'campanhas' && !loading && itensFiltrados.length === 0 && conectado && !semConta && (
          <div className="px-6 py-3 border-t border-gray-800">
            <span className="text-gray-500 text-xs">Por que as campanhas nao estao aparecendo?</span>
          </div>
        )}
      </div>
    </div>
  );
}
