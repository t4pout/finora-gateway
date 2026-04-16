'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';
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
  orcamentoDiario?: number;
  objetivo?: string;
  thumbnail?: string;
  moeda?: string;
  totalGasto?: number;
  saldo?: number;
}

const fmt = (v: number) => 'R$ ' + v.toFixed(2).replace('.', ',');
const fmtN = (v: number, d = 2) => v.toFixed(d).replace('.', ',');
const roasColor = (v: number) => v === 0 ? 'text-gray-500' : v >= 3 ? 'text-green-400' : v >= 2 ? 'text-amber-400' : 'text-red-400';
const lucroColor = (v: number) => v >= 0 ? 'text-green-400' : 'text-red-400';
const statusColor = (s: string) => s === 'ACTIVE' ? 'bg-green-900 text-green-300' : s === 'PAUSED' ? 'bg-amber-900 text-amber-300' : 'bg-gray-700 text-gray-400';
const statusLabel = (s: string) => s === 'ACTIVE' ? 'Ativo' : s === 'PAUSED' ? 'Pausado' : s === 'ARCHIVED' ? 'Arquivado' : s;

type Nivel = 'contas' | 'campanhas' | 'conjuntos' | 'anuncios';

export default function FinoraUTMMeta() {
  const [nivel, setNivel] = useState<Nivel>('contas');
  const [contas, setContas] = useState<ItemMeta[]>([]);
  const [campanhas, setCampanhas] = useState<ItemMeta[]>([]);
  const [conjuntos, setConjuntos] = useState<ItemMeta[]>([]);
  const [anuncios, setAnuncios] = useState<ItemMeta[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState<ItemMeta | null>(null);
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<ItemMeta | null>(null);
  const [conjuntoSelecionado, setConjuntoSelecionado] = useState<ItemMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [semConta, setSemConta] = useState(false);
  const [erro, setErro] = useState('');
  const [dias, setDias] = useState('30');
  const [accountNome, setAccountNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [contasDisponiveis, setContasDisponiveis] = useState<any[]>([]);

  useEffect(() => { verificarConexao(); }, []);

  const verificarConexao = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/integracoes/meta/contas', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) { setConectado(false); return; }
      const data = await res.json();
      setConectado(true);
      if (data.contas && data.contas.length > 0) {
        setContasDisponiveis(data.contas);
        if (data.contas.length === 1) {
          await selecionarConta(data.contas[0].id, data.contas[0].name);
        } else {
          carregarNivel('contas');
        }
      } else {
        setSemConta(true);
        carregarNivel('contas');
      }
    } catch (e) { setConectado(false); }
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
    carregarNivel('campanhas');
  };

  const carregarNivel = async (n: Nivel, id?: string) => {
    setLoading(true);
    setErro('');
    setBusca('');
    setFiltroStatus('');
    try {
      const token = localStorage.getItem('token');
      let url = '/api/integracoes/meta/gerenciador?nivel=' + n + '&dias=' + dias;
      if (n === 'conjuntos' && id) url += '&campanhaId=' + id;
      if (n === 'anuncios' && id) url += '&conjuntoId=' + id;
      const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      if (data.erro) { setErro(data.erro); setLoading(false); return; }
      if (n === 'contas') setContas(data.contas || []);
      if (n === 'campanhas') { setCampanhas(data.campanhas || []); if (data.accountNome) setAccountNome(data.accountNome); }
      if (n === 'conjuntos') setConjuntos(data.conjuntos || []);
      if (n === 'anuncios') setAnuncios(data.anuncios || []);
      setNivel(n);
    } catch (e) { setErro('Erro ao carregar dados'); }
    setLoading(false);
  };

  const irParaContas = () => { setNivel('contas'); setContaSelecionada(null); setCampanhaSelecionada(null); setConjuntoSelecionado(null); carregarNivel('contas'); };
  const irParaCampanhas = (conta?: ItemMeta) => { if (conta) setContaSelecionada(conta); setCampanhaSelecionada(null); setConjuntoSelecionado(null); carregarNivel('campanhas'); };
  const irParaConjuntos = (campanha: ItemMeta) => { setCampanhaSelecionada(campanha); setConjuntoSelecionado(null); carregarNivel('conjuntos', campanha.id); };
  const irParaAnuncios = (conjunto: ItemMeta) => { setConjuntoSelecionado(conjunto); carregarNivel('anuncios', conjunto.id); };

  const itensAtivos = nivel === 'contas' ? contas : nivel === 'campanhas' ? campanhas : nivel === 'conjuntos' ? conjuntos : anuncios;
  const itensFiltrados = itensAtivos.filter(i => {
    if (filtroStatus && i.status !== filtroStatus) return false;
    if (busca && !i.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const totalGasto = itensFiltrados.reduce((acc, i) => acc + i.gasto, 0);
  const totalReceita = itensFiltrados.reduce((acc, i) => acc + i.receitaFinora, 0);
  const totalVendas = itensFiltrados.reduce((acc, i) => acc + i.vendasFinora, 0);
  const totalLucro = itensFiltrados.reduce((acc, i) => acc + i.lucro, 0);
  const roasGeral = totalGasto > 0 ? totalReceita / totalGasto : 0;

  const abaClass = (n: Nivel) =>
    'px-5 py-3 text-sm font-medium border-b-2 transition -mb-px flex items-center gap-2 ' +
    (nivel === n ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300');

  const niveisLabel: Record<Nivel, string> = { contas: 'Contas', campanhas: 'Campanhas', conjuntos: 'Conjuntos', anuncios: 'Anuncios' };
  const niveisIcons: Record<Nivel, string> = { contas: '🏢', campanhas: '📢', conjuntos: '👥', anuncios: '🖼' };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Meta Ads</h1>
          <p className="text-gray-500 text-sm">{accountNome || 'Gerenciador de anuncios'}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={dias} onChange={e => { setDias(e.target.value); setTimeout(() => carregarNivel(nivel), 100); }}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 outline-none">
            <option value="hoje">Hoje</option>
            <option value="7">Ultimos 7 dias</option>
            <option value="14">Ultimos 14 dias</option>
            <option value="30">Ultimos 30 dias</option>
            <option value="90">Ultimos 90 dias</option>
          </select>
          <button onClick={() => carregarNivel(nivel)}
            className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {!conectado && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <div>
              <div className="text-red-300 font-semibold text-sm">Voce precisa conectar o Meta Ads</div>
              <div className="text-red-400 text-xs mt-0.5">Conecte sua conta para acessar os dados das campanhas</div>
            </div>
          </div>
          <Link href="/finora-utm/integracoes">
            <button className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition">
              Conectar Meta Ads
            </button>
          </Link>
        </div>
      )}

      {conectado && semConta && (
        <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-400 shrink-0" />
            <div>
              <div className="text-amber-300 font-semibold text-sm">Nenhuma conta de anuncio encontrada</div>
              <div className="text-amber-400 text-xs mt-0.5">O perfil conectado nao tem acesso a contas de anuncio. Reconecte com o perfil admin.</div>
            </div>
          </div>
          <Link href="/finora-utm/integracoes">
            <button className="px-4 py-2 bg-amber-700 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition">
              Reconectar
            </button>
          </Link>
        </div>
      )}

      {contasDisponiveis.length > 1 && (
        <div className="bg-gray-800 border border-blue-700 rounded-xl p-5 mb-4">
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
        <div className="bg-red-950 border border-red-800 rounded-xl p-4 mb-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <div>
            <div className="text-red-300 font-semibold text-sm">Erro ao carregar dados</div>
            <div className="text-red-400 text-xs mt-1">{erro}</div>
          </div>
        </div>
      )}

      <div className="flex border-b border-gray-700 mb-1">
        {(['contas', 'campanhas', 'conjuntos', 'anuncios'] as Nivel[]).map(n => (
          <button key={n} onClick={() => {
            if (n === 'contas') irParaContas();
            else if (n === 'campanhas') irParaCampanhas();
            else if (n === 'conjuntos' && campanhaSelecionada) irParaConjuntos(campanhaSelecionada);
            else if (n === 'anuncios' && conjuntoSelecionado) irParaAnuncios(conjuntoSelecionado);
          }}
            disabled={(n === 'conjuntos' && !campanhaSelecionada) || (n === 'anuncios' && !conjuntoSelecionado)}
            className={abaClass(n) + ((n === 'conjuntos' && !campanhaSelecionada) || (n === 'anuncios' && !conjuntoSelecionado) ? ' opacity-40 cursor-not-allowed' : '')}>
            <span>{niveisIcons[n]}</span>
            <span>{niveisLabel[n]}</span>
            {n === 'contas' && contas.length > 0 && <span className="text-xs opacity-50">({contas.length})</span>}
            {n === 'campanhas' && campanhas.length > 0 && <span className="text-xs opacity-50">({campanhas.length})</span>}
            {n === 'conjuntos' && conjuntos.length > 0 && <span className="text-xs opacity-50">({conjuntos.length})</span>}
            {n === 'anuncios' && anuncios.length > 0 && <span className="text-xs opacity-50">({anuncios.length})</span>}
          </button>
        ))}
      </div>

      {(campanhaSelecionada || conjuntoSelecionado) && (
        <div className="flex items-center gap-2 text-xs text-gray-500 py-2 mb-2">
          <button onClick={irParaContas} className="hover:text-white transition">Contas</button>
          {contaSelecionada && <><ChevronRight size={12} /><button onClick={() => irParaCampanhas()} className="hover:text-white transition truncate max-w-32">{contaSelecionada.nome}</button></>}
          {campanhaSelecionada && <><ChevronRight size={12} /><button onClick={() => irParaConjuntos(campanhaSelecionada)} className="hover:text-white transition truncate max-w-32">{campanhaSelecionada.nome}</button></>}
          {conjuntoSelecionado && <><ChevronRight size={12} /><span className="text-gray-400 truncate max-w-32">{conjuntoSelecionado.nome}</span></>}
        </div>
      )}

      <div className="grid grid-cols-5 gap-3 mb-4 mt-3">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Gastos</div>
          <div className="text-xl font-bold text-amber-400">{fmt(totalGasto)}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Fat. Liquido</div>
          <div className="text-xl font-bold text-white">{fmt(totalReceita)}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Lucro</div>
          <div className={'text-xl font-bold ' + lucroColor(totalLucro)}>{fmt(totalLucro)}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">ROAS</div>
          <div className={'text-xl font-bold ' + roasColor(roasGeral)}>{roasGeral > 0 ? fmtN(roasGeral) + 'x' : 'N/A'}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Vendas Finora</div>
          <div className="text-xl font-bold text-green-400">{totalVendas}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder={'Filtrar por nome de ' + niveisLabel[nivel].toLowerCase() + '...'}
          className="flex-1 max-w-sm px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none" />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none">
          <option value="">Qualquer status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="PAUSED">Pausado</option>
          <option value="ARCHIVED">Arquivado</option>
        </select>
        <span className="text-gray-500 text-xs">{itensFiltrados.length} {niveisLabel[nivel].toLowerCase()}</span>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Carregando {niveisLabel[nivel].toLowerCase()}...</div>
        ) : itensFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {!conectado || semConta ? 'Conecte o Meta Ads para ver os dados' : 'Nenhum resultado encontrado'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{minWidth: nivel === 'contas' ? '900px' : '1300px'}}>
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase sticky left-0 bg-gray-800">Nome</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase">Status</th>
                  {nivel === 'contas' && <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Total gasto</th>}
                  {nivel === 'contas' && <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Saldo</th>}
                  {nivel === 'campanhas' && <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Orcamento/dia</th>}
                  {nivel !== 'contas' && <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Gasto</th>}
                  {nivel !== 'contas' && <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Impressoes</th>}
                  {nivel !== 'contas' && <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Cliques</th>}
                  {nivel !== 'contas' && <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CTR</th>}
                  {nivel !== 'contas' && <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPC</th>}
                  {nivel !== 'contas' && <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPM</th>}
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Vendas</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Fat. Liq.</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Lucro</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">ROAS</th>
                  {nivel !== 'contas' && <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPA</th>}
                  {nivel !== 'contas' && <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Margem</th>}
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map((item, i) => (
                  <tr key={i}
                    className={'border-b border-gray-700 hover:bg-gray-750 transition cursor-pointer'}
                    onClick={() => {
                      if (nivel === 'contas') irParaCampanhas(item);
                      else if (nivel === 'campanhas') irParaConjuntos(item);
                      else if (nivel === 'conjuntos') irParaAnuncios(item);
                    }}>
                    <td className="py-3 px-4 sticky left-0 bg-gray-800">
                      <div className="flex items-center gap-2">
                        {nivel === 'anuncios' && item.thumbnail && (
                          <img src={item.thumbnail} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        )}
                        <div>
                          <div className="text-white text-xs font-medium max-w-48 truncate">{item.nome}</div>
                          {item.objetivo && <div className="text-gray-500 text-xs">{item.objetivo}</div>}
                          {item.moeda && <div className="text-gray-500 text-xs">{item.moeda}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={'px-2 py-0.5 rounded text-xs ' + statusColor(item.status)}>{statusLabel(item.status)}</span>
                    </td>
                    {nivel === 'contas' && <td className="py-3 px-4 text-right text-amber-400 text-xs">{item.totalGasto ? fmt(item.totalGasto) : '-'}</td>}
                    {nivel === 'contas' && <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.saldo ? fmt(item.saldo) : '-'}</td>}
                    {nivel === 'campanhas' && <td className="py-3 px-4 text-right text-gray-400 text-xs">{(item.orcamentoDiario || 0) > 0 ? fmt(item.orcamentoDiario || 0) : '-'}</td>}
                    {nivel !== 'contas' && <td className="py-3 px-4 text-right text-amber-400 text-xs">{item.gasto > 0 ? fmt(item.gasto) : '-'}</td>}
                    {nivel !== 'contas' && <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.impressoes > 0 ? item.impressoes.toLocaleString('pt-BR') : '-'}</td>}
                    {nivel !== 'contas' && <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cliques > 0 ? item.cliques.toLocaleString('pt-BR') : '-'}</td>}
                    {nivel !== 'contas' && <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.ctr > 0 ? fmtN(item.ctr) + '%' : '-'}</td>}
                    {nivel !== 'contas' && <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cpc > 0 ? fmt(item.cpc) : '-'}</td>}
                    {nivel !== 'contas' && <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cpm > 0 ? fmt(item.cpm) : '-'}</td>}
                    <td className="py-3 px-4 text-right text-green-400 text-xs font-semibold">{item.vendasFinora > 0 ? item.vendasFinora : '-'}</td>
                    <td className="py-3 px-4 text-right text-white text-xs">{item.receitaFinora > 0 ? fmt(item.receitaFinora) : '-'}</td>
                    <td className={'py-3 px-4 text-right text-xs font-semibold ' + lucroColor(item.lucro)}>{item.receitaFinora > 0 ? fmt(item.lucro) : '-'}</td>
                    <td className={'py-3 px-4 text-right text-xs font-bold ' + roasColor(item.roas)}>{item.roas > 0 ? fmtN(item.roas) + 'x' : 'N/A'}</td>
                    {nivel !== 'contas' && <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cpa > 0 ? fmt(item.cpa) : '-'}</td>}
                    {nivel !== 'contas' && <td className={'py-3 px-4 text-right text-xs ' + roasColor(item.margem)}>{item.margem > 0 ? fmtN(item.margem) + '%' : '-'}</td>}
                    <td className="py-3 px-4 text-right">
                      {nivel !== 'anuncios' && <ChevronRight size={14} className="text-gray-500 inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
