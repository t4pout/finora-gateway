'use client';

import { useEffect, useState } from 'react';
import { Link2, Copy, Trash2, Plus, Check, BarChart3, RefreshCw } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  planos: { id: string; nome: string; linkUnico: string }[];
  paginasOfertas: { id: string; nome: string; link: string }[];
}

interface LinkSalvo {
  id: string;
  nome: string;
  urlFinal: string;
  urlDestino: string;
  utmSource: string;
  utmMedium?: string;
  utmCampaign?: string;
  cliques: number;
  createdAt: string;
  produto?: { nome: string } | null;
}

interface MetricaLink {
  linkId: string;
  vendas: number;
  receita: number;
  taxaConversao: number;
}

const fmt = (v: number) => 'R$ ' + v.toFixed(2).replace('.', ',');

export default function FinoraUTMLinks() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [links, setLinks] = useState<LinkSalvo[]>([]);
  const [metricas, setMetricas] = useState<Record<string, MetricaLink>>({});
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [tipoLink, setTipoLink] = useState('');
  const [planoSelecionado, setPlanoSelecionado] = useState('');
  const [paginaSelecionada, setPaginaSelecionada] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [nome, setNome] = useState('');
  const [linkGerado, setLinkGerado] = useState('');
  const [copiado, setCopiadoId] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroPlatforma, setFiltroPlatforma] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'links' | 'relatorio'>('links');
  const [periodo, setPeriodo] = useState('30');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    carregarProdutos(token);
    carregarLinks(token);
  }, []);

  useEffect(() => {
    if (links.length > 0) carregarMetricas();
  }, [links, periodo]);

  const carregarProdutos = async (token: string) => {
    const res = await fetch('/api/produtos', { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.ok) { const d = await res.json(); setProdutos(d.produtos || []); }
  };

  const carregarLinks = async (token: string) => {
    const res = await fetch('/api/links-utm', { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.ok) { const d = await res.json(); setLinks(d.links || []); }
  };

  const carregarMetricas = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/finora-utm?dias=' + periodo, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, MetricaLink> = {};
        links.forEach(link => {
          const campanha = data.porCampanha?.find((c: any) => c.campanha === link.utmCampaign);
          map[link.id] = {
            linkId: link.id,
            vendas: campanha?.vendas || 0,
            receita: campanha?.faturamentoLiquido || 0,
            taxaConversao: link.cliques > 0 ? ((campanha?.vendas || 0) / link.cliques) * 100 : 0
          };
        });
        setMetricas(map);
      }
    } catch (e) { console.error(e); }
  };

  const planosDisponiveis = produtoSelecionado ? produtos.find(p => p.id === produtoSelecionado)?.planos || [] : [];
  const paginasDisponiveis = produtoSelecionado ? produtos.find(p => p.id === produtoSelecionado)?.paginasOfertas || [] : [];

  const gerarLink = () => {
    if (!utmSource) { alert('utm_source e obrigatorio'); return; }
    let base = '';
    if (tipoLink === 'pagina') {
      if (!paginaSelecionada) { alert('Selecione uma pagina'); return; }
      base = paginaSelecionada;
    } else if (tipoLink === 'checkout') {
      const plano = planosDisponiveis.find(p => p.id === planoSelecionado);
      if (!plano) { alert('Selecione um plano'); return; }
      base = 'https://finorapayments.com/checkout/' + plano.linkUnico;
    } else { alert('Selecione o tipo'); return; }
    const params = new URLSearchParams();
    params.set('utm_source', utmSource.trim());
    if (utmMedium.trim()) params.set('utm_medium', utmMedium.trim());
    if (utmCampaign.trim()) params.set('utm_campaign', utmCampaign.trim());
    setLinkGerado(base + '?' + params.toString());
  };

  const salvarLink = async () => {
    if (!linkGerado) return;
    setSalvando(true);
    try {
      const token = localStorage.getItem('token');
      const plano = planosDisponiveis.find(p => p.id === planoSelecionado);
      const urlDestino = tipoLink === 'pagina' ? paginaSelecionada : 'https://finorapayments.com/checkout/' + (plano?.linkUnico || '');
      const res = await fetch('/api/links-utm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ nome: nome || utmSource + ' - ' + (utmCampaign || 'sem campanha'), urlDestino, utmSource, utmMedium, utmCampaign, urlFinal: linkGerado, produtoId: produtoSelecionado || null })
      });
      if (res.ok) {
        setLinkGerado(''); setNome(''); setUtmSource(''); setUtmMedium(''); setUtmCampaign('');
        setAberto(false);
        const t = localStorage.getItem('token');
        if (t) carregarLinks(t);
      }
    } catch (e) { alert('Erro ao salvar'); }
    setSalvando(false);
  };

  const copiar = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(''), 2000);
  };

  const remover = async (id: string) => {
    if (!confirm('Remover este link?')) return;
    const token = localStorage.getItem('token');
    await fetch('/api/links-utm?id=' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    setLinks(links.filter(l => l.id !== id));
  };

  const presets = [
    { label: 'Facebook', source: 'facebook', medium: 'cpc' },
    { label: 'Instagram', source: 'instagram', medium: 'cpc' },
    { label: 'Google', source: 'google', medium: 'cpc' },
    { label: 'TikTok', source: 'tiktok', medium: 'cpc' },
    { label: 'WhatsApp', source: 'whatsapp', medium: 'social' },
    { label: 'Email', source: 'email', medium: 'email' },
    { label: 'Kwai', source: 'kwai', medium: 'cpc' },
    { label: 'Organico', source: 'organico', medium: 'organic' },
  ];

  const linksFiltrados = links.filter(l => {
    if (busca && !l.nome.toLowerCase().includes(busca.toLowerCase()) && !l.utmCampaign?.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroPlatforma && l.utmSource !== filtroPlatforma) return false;
    return true;
  });

  const plataformasUnicas = [...new Set(links.map(l => l.utmSource).filter(Boolean))];

  const totalVendasLinks = Object.values(metricas).reduce((acc, m) => acc + m.vendas, 0);
  const totalReceitaLinks = Object.values(metricas).reduce((acc, m) => acc + m.receita, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Links UTM</h1>
          <p className="text-gray-500 text-sm">{links.length} links salvos</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 outline-none">
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </select>
          <button onClick={() => setAberto(!aberto)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition">
            <Plus size={16} /> Novo Link
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Links ativos</div>
          <div className="text-2xl font-bold text-white">{links.length}</div>
          <div className="text-gray-500 text-xs mt-1">{plataformasUnicas.length} plataformas</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Vendas geradas</div>
          <div className="text-2xl font-bold text-green-400">{totalVendasLinks}</div>
          <div className="text-gray-500 text-xs mt-1">nos ultimos {periodo} dias</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Receita gerada</div>
          <div className="text-2xl font-bold text-purple-400">{fmt(totalReceitaLinks)}</div>
          <div className="text-gray-500 text-xs mt-1">faturamento liquido</div>
        </div>
      </div>

      {aberto && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Gerar novo link</h2>
            <button onClick={() => setAberto(false)} className="text-gray-500 hover:text-white text-xl leading-none">x</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Produto</label>
              <select value={produtoSelecionado} onChange={e => { setProdutoSelecionado(e.target.value); setPlanoSelecionado(''); setPaginaSelecionada(''); setTipoLink(''); }}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none">
                <option value="">Selecione...</option>
                {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Tipo de link</label>
              <select value={tipoLink} onChange={e => setTipoLink(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none">
                <option value="">Selecione...</option>
                <option value="checkout">Checkout direto</option>
                <option value="pagina">Pagina de vendas</option>
              </select>
            </div>
          </div>
          {tipoLink === 'checkout' && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-400 mb-2">Plano</label>
              <select value={planoSelecionado} onChange={e => setPlanoSelecionado(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none">
                <option value="">Selecione...</option>
                {planosDisponiveis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          )}
          {tipoLink === 'pagina' && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-400 mb-2">Pagina</label>
              <select value={paginaSelecionada} onChange={e => setPaginaSelecionada(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none">
                <option value="">Selecione...</option>
                {paginasDisponiveis.map(p => <option key={p.id} value={p.link}>{p.nome}</option>)}
              </select>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-400 mb-2">Plataforma</label>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button key={p.label} onClick={() => { setUtmSource(p.source); setUtmMedium(p.medium); }}
                  className={'px-3 py-1.5 rounded-lg text-xs font-medium border transition ' + (utmSource === p.source ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-purple-500')}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">utm_source *</label>
              <input value={utmSource} onChange={e => setUtmSource(e.target.value)} placeholder="facebook"
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">utm_medium</label>
              <input value={utmMedium} onChange={e => setUtmMedium(e.target.value)} placeholder="cpc"
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">utm_campaign</label>
              <input value={utmCampaign} onChange={e => setUtmCampaign(e.target.value)} placeholder="lancamento-maio"
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-400 mb-2">Nome para identificar</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="ex: Facebook - Lancamento Maio"
              className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none" />
          </div>
          <button onClick={gerarLink} className="w-full py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition text-sm flex items-center justify-center gap-2">
            <Link2 size={16} /> Gerar Link
          </button>
          {linkGerado && (
            <div className="mt-4 bg-gray-900 border border-purple-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-400 text-xs font-semibold">Link gerado</span>
                <div className="flex gap-2">
                  <button onClick={() => copiar(linkGerado, 'novo')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg hover:bg-gray-700 transition">
                    {copiado === 'novo' ? <Check size={12} /> : <Copy size={12} />}
                    {copiado === 'novo' ? 'Copiado' : 'Copiar'}
                  </button>
                  <button onClick={salvarLink} disabled={salvando} className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
              <div className="font-mono text-xs text-gray-400 break-all">{linkGerado}</div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar link..."
          className="flex-1 max-w-xs px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none" />
        <select value={filtroPlatforma} onChange={e => setFiltroPlatforma(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm outline-none">
          <option value="">Todas plataformas</option>
          {plataformasUnicas.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-gray-500 text-xs">{linksFiltrados.length} links</span>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{minWidth: '900px'}}>
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-5 text-xs text-gray-500 uppercase">Nome / Link</th>
                <th className="text-left py-3 px-5 text-xs text-gray-500 uppercase">Plataforma</th>
                <th className="text-left py-3 px-5 text-xs text-gray-500 uppercase">Campanha</th>
                <th className="text-right py-3 px-5 text-xs text-gray-500 uppercase">Vendas</th>
                <th className="text-right py-3 px-5 text-xs text-gray-500 uppercase">Receita</th>
                <th className="text-right py-3 px-5 text-xs text-gray-500 uppercase">Conv.</th>
                <th className="text-right py-3 px-5 text-xs text-gray-500 uppercase">Criado em</th>
                <th className="py-3 px-5"></th>
              </tr>
            </thead>
            <tbody>
              {linksFiltrados.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-500 text-sm">Nenhum link encontrado</td></tr>
              ) : linksFiltrados.map(link => {
                const m = metricas[link.id];
                return (
                  <tr key={link.id} className="border-b border-gray-700 hover:bg-gray-750 transition">
                    <td className="py-3 px-5">
                      <div className="text-white text-sm font-medium mb-1">{link.nome}</div>
                      <div className="font-mono text-xs text-gray-500 truncate max-w-xs">{link.urlFinal}</div>
                    </td>
                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 bg-blue-900 text-blue-300 rounded text-xs">{link.utmSource}</span>
                      {link.utmMedium && <span className="ml-1 px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">{link.utmMedium}</span>}
                    </td>
                    <td className="py-3 px-5">
                      {link.utmCampaign ? <span className="px-2 py-0.5 bg-purple-900 text-purple-300 rounded text-xs">{link.utmCampaign}</span> : <span className="text-gray-600 text-xs">-</span>}
                    </td>
                    <td className="py-3 px-5 text-right text-green-400 text-sm font-semibold">{m?.vendas || 0}</td>
                    <td className="py-3 px-5 text-right text-white text-sm">{m ? fmt(m.receita) : 'R$ 0,00'}</td>
                    <td className="py-3 px-5 text-right text-gray-400 text-xs">{m?.taxaConversao ? m.taxaConversao.toFixed(1) + '%' : '-'}</td>
                    <td className="py-3 px-5 text-right text-gray-500 text-xs">{new Date(link.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => copiar(link.urlFinal, link.id)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition">
                          {copiado === link.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                        <button onClick={() => remover(link.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
