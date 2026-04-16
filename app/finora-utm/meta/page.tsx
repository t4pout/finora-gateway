'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';

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
}

const fmt = (v: number) => 'R$ ' + v.toFixed(2).replace('.', ',');
const fmtN = (v: number, d = 2) => v.toFixed(d).replace('.', ',');
const roasColor = (v: number) => v === 0 ? 'text-gray-500' : v >= 3 ? 'text-green-400' : v >= 2 ? 'text-amber-400' : 'text-red-400';
const lucroColor = (v: number) => v >= 0 ? 'text-green-400' : 'text-red-400';
const statusColor = (s: string) => s === 'ACTIVE' ? 'bg-green-900 text-green-300' : s === 'PAUSED' ? 'bg-amber-900 text-amber-300' : 'bg-gray-700 text-gray-400';
const statusLabel = (s: string) => s === 'ACTIVE' ? 'Ativa' : s === 'PAUSED' ? 'Pausada' : s === 'ARCHIVED' ? 'Arquivada' : s;

export default function FinoraUTMMeta() {
  const [nivel, setNivel] = useState<'campanhas' | 'conjuntos' | 'anuncios'>('campanhas');
  const [campanhas, setCampanhas] = useState<ItemMeta[]>([]);
  const [conjuntos, setConjuntos] = useState<ItemMeta[]>([]);
  const [anuncios, setAnuncios] = useState<ItemMeta[]>([]);
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<ItemMeta | null>(null);
  const [conjuntoSelecionado, setConjuntoSelecionado] = useState<ItemMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [dias, setDias] = useState('30');
  const [accountNome, setAccountNome] = useState('');
  const [contasDisponiveis, setContasDisponiveis] = useState<any[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => { verificarConta(); }, []);
  useEffect(() => { if (!erro) carregarCampanhas(); }, [dias]);

  const verificarConta = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/integracoes/meta/contas', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (data.contas && data.contas.length > 0) {
        setContasDisponiveis(data.contas);
        if (data.contas.length === 1) {
          await selecionarConta(data.contas[0].id, data.contas[0].name);
        }
      } else {
        carregarCampanhas();
      }
    } catch (e) { carregarCampanhas(); }
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
    carregarCampanhas();
  };

  const carregarCampanhas = async () => {
    setLoading(true);
    setErro('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/integracoes/meta/gerenciador?nivel=campanhas&dias=${dias}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (data.erro) { setErro(data.erro); setLoading(false); return; }
      setCampanhas(data.campanhas || []);
      setAccountNome(data.accountNome || '');
      setNivel('campanhas');
      setCampanhaSelecionada(null);
      setConjuntoSelecionado(null);
    } catch (e) { setErro('Erro ao carregar campanhas'); }
    setLoading(false);
  };

  const carregarConjuntos = async (campanha: ItemMeta) => {
    setLoading(true);
    setErro('');
    setCampanhaSelecionada(campanha);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/integracoes/meta/gerenciador?nivel=conjuntos&campanhaId=${campanha.id}&dias=${dias}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (data.erro) { setErro(data.erro); setLoading(false); return; }
      setConjuntos(data.conjuntos || []);
      setNivel('conjuntos');
      setConjuntoSelecionado(null);
    } catch (e) { setErro('Erro ao carregar conjuntos'); }
    setLoading(false);
  };

  const carregarAnuncios = async (conjunto: ItemMeta) => {
    setLoading(true);
    setErro('');
    setConjuntoSelecionado(conjunto);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/integracoes/meta/gerenciador?nivel=anuncios&conjuntoId=${conjunto.id}&dias=${dias}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (data.erro) { setErro(data.erro); setLoading(false); return; }
      setAnuncios(data.anuncios || []);
      setNivel('anuncios');
    } catch (e) { setErro('Erro ao carregar anuncios'); }
    setLoading(false);
  };

  const itensAtivos = nivel === 'campanhas' ? campanhas : nivel === 'conjuntos' ? conjuntos : anuncios;
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Meta Ads</h1>
          <p className="text-gray-500 text-sm">{accountNome || 'Gerenciador de anuncios'}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={dias} onChange={e => setDias(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 outline-none">
            <option value="7">7 dias</option>
            <option value="14">14 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </select>
          <button onClick={carregarCampanhas} className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm">
        <button onClick={carregarCampanhas} className={'px-3 py-1.5 rounded-lg transition ' + (nivel === 'campanhas' ? 'bg-blue-700 text-white' : 'text-gray-400 hover:text-white')}>
          Campanhas {campanhas.length > 0 && <span className="ml-1 text-xs opacity-70">({campanhas.length})</span>}
        </button>
        {campanhaSelecionada && (
          <>
            <ChevronRight size={14} className="text-gray-600" />
            <button onClick={() => { setNivel('conjuntos'); setConjuntoSelecionado(null); }}
              className={'px-3 py-1.5 rounded-lg transition ' + (nivel === 'conjuntos' ? 'bg-blue-700 text-white' : 'text-gray-400 hover:text-white')}>
              {campanhaSelecionada.nome.length > 30 ? campanhaSelecionada.nome.substring(0, 30) + '...' : campanhaSelecionada.nome}
            </button>
          </>
        )}
        {conjuntoSelecionado && (
          <>
            <ChevronRight size={14} className="text-gray-600" />
            <button onClick={() => setNivel('anuncios')}
              className={'px-3 py-1.5 rounded-lg transition ' + (nivel === 'anuncios' ? 'bg-blue-700 text-white' : 'text-gray-400 hover:text-white')}>
              {conjuntoSelecionado.nome.length > 25 ? conjuntoSelecionado.nome.substring(0, 25) + '...' : conjuntoSelecionado.nome}
            </button>
          </>
        )}
      </div>

       {contasDisponiveis.length > 1 && (
        <div className="bg-gray-800 border border-amber-700 rounded-xl p-5 mb-4">
          <div className="text-amber-300 font-semibold text-sm mb-3">Selecione a conta de anuncios</div>
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
        <div className="bg-red-900 border border-red-700 rounded-xl p-4 mb-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <div>
            <div className="text-red-300 font-semibold text-sm">Erro ao carregar dados do Meta</div>
            <div className="text-red-400 text-xs mt-1">{erro}</div>
          </div>
        </div>
      )}

      {!erro && (
        <>
          <div className="grid grid-cols-5 gap-3 mb-4">
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
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Vendas</div>
              <div className="text-xl font-bold text-green-400">{totalVendas}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder={'Buscar ' + nivel + '...'}
              className="flex-1 max-w-xs px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none" />
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none">
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativas</option>
              <option value="PAUSED">Pausadas</option>
              <option value="ARCHIVED">Arquivadas</option>
            </select>
            <span className="text-gray-500 text-xs">{itensFiltrados.length} {nivel}</span>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500 text-sm">Carregando dados do Meta Ads...</div>
            ) : itensFiltrados.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                {itensAtivos.length === 0 ? 'Nenhum dado encontrado no periodo selecionado' : 'Nenhum resultado para os filtros aplicados'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{minWidth: '1300px'}}>
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase sticky left-0 bg-gray-800">Nome</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase">Status</th>
                      {nivel === 'campanhas' && <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Orcamento/dia</th>}
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Gasto</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Impressoes</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Cliques</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CTR</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPC</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPM</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Vendas</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Fat. Liq.</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Lucro</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">ROAS</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">CPA</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Margem</th>
                      {nivel !== 'anuncios' && <th className="py-3 px-4"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {itensFiltrados.map((item, i) => (
                      <tr key={i} className="border-b border-gray-700 hover:bg-gray-750 transition cursor-pointer"
                        onClick={() => nivel === 'campanhas' ? carregarConjuntos(item) : nivel === 'conjuntos' ? carregarAnuncios(item) : null}>
                        <td className="py-3 px-4 sticky left-0 bg-gray-800">
                          <div className="flex items-center gap-2">
                            {nivel === 'anuncios' && item.thumbnail && (
                              <img src={item.thumbnail} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                            )}
                            <div>
                              <div className="text-white text-xs font-medium max-w-48 truncate">{item.nome}</div>
                              {item.objetivo && <div className="text-gray-500 text-xs">{item.objetivo}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={'px-2 py-0.5 rounded text-xs ' + statusColor(item.status)}>{statusLabel(item.status)}</span>
                        </td>
                        {nivel === 'campanhas' && (
                          <td className="py-3 px-4 text-right text-gray-400 text-xs">
                            {(item.orcamentoDiario || 0) > 0 ? fmt(item.orcamentoDiario || 0) : '-'}
                          </td>
                        )}
                        <td className="py-3 px-4 text-right text-amber-400 text-xs">{item.gasto > 0 ? fmt(item.gasto) : '-'}</td>
                        <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.impressoes > 0 ? item.impressoes.toLocaleString('pt-BR') : '-'}</td>
                        <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cliques > 0 ? item.cliques.toLocaleString('pt-BR') : '-'}</td>
                        <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.ctr > 0 ? fmtN(item.ctr) + '%' : '-'}</td>
                        <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cpc > 0 ? fmt(item.cpc) : '-'}</td>
                        <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cpm > 0 ? fmt(item.cpm) : '-'}</td>
                        <td className="py-3 px-4 text-right text-green-400 text-xs font-semibold">{item.vendasFinora > 0 ? item.vendasFinora : '-'}</td>
                        <td className="py-3 px-4 text-right text-white text-xs">{item.receitaFinora > 0 ? fmt(item.receitaFinora) : '-'}</td>
                        <td className={'py-3 px-4 text-right text-xs font-semibold ' + lucroColor(item.lucro)}>{item.receitaFinora > 0 ? fmt(item.lucro) : '-'}</td>
                        <td className={'py-3 px-4 text-right text-xs font-bold ' + roasColor(item.roas)}>{item.roas > 0 ? fmtN(item.roas) + 'x' : 'N/A'}</td>
                        <td className="py-3 px-4 text-right text-gray-400 text-xs">{item.cpa > 0 ? fmt(item.cpa) : '-'}</td>
                        <td className={'py-3 px-4 text-right text-xs ' + roasColor(item.margem)}>{item.margem > 0 ? fmtN(item.margem) + '%' : '-'}</td>
                        {nivel !== 'anuncios' && (
                          <td className="py-3 px-4 text-right">
                            <ChevronRight size={14} className="text-gray-500 inline" />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}