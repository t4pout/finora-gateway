'use client';

import { useEffect, useState } from 'react';
import { Link2, Copy, Trash2, Plus, Check } from 'lucide-react';

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
  utmSource: string;
  utmMedium?: string;
  utmCampaign?: string;
  cliques: number;
  createdAt: string;
}

export default function FinoraUTMLinks() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [links, setLinks] = useState<LinkSalvo[]>([]);
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    carregarProdutos(token);
    carregarLinks(token);
  }, []);

  const carregarProdutos = async (token: string) => {
    const res = await fetch('/api/produtos', { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.ok) { const d = await res.json(); setProdutos(d.produtos || []); }
  };

  const carregarLinks = async (token: string) => {
    const res = await fetch('/api/links-utm', { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.ok) { const d = await res.json(); setLinks(d.links || []); }
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
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Links UTM</h1>
          <p className="text-gray-500 text-sm">Gere e salve links rastreados para suas campanhas</p>
        </div>
        <button onClick={() => setAberto(!aberto)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition">
          <Plus size={16} /> Novo Link
        </button>
      </div>

      {aberto && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-5">Gerar novo link</h2>
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

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Links salvos</h2>
          <span className="text-gray-500 text-xs">{links.length} link{links.length !== 1 ? 's' : ''}</span>
        </div>
        {links.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Nenhum link salvo ainda. Crie seu primeiro link acima.</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {links.map(link => (
              <div key={link.id} className="px-5 py-4 hover:bg-gray-750 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">{link.nome}</span>
                      <span className="px-2 py-0.5 bg-purple-900 text-purple-300 text-xs rounded">{link.utmSource}</span>
                      {link.utmCampaign && <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">{link.utmCampaign}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{new Date(link.createdAt).toLocaleString('pt-BR')}</div>
                    <div className="font-mono text-xs text-gray-500 break-all bg-gray-900 rounded px-3 py-2">{link.urlFinal}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => copiar(link.urlFinal, link.id)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition">
                      {copiado === link.id ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                    <button onClick={() => remover(link.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}