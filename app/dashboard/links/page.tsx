'use client';

import Sidebar from '@/app/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, Copy, Check, Trash2, Lock } from 'lucide-react';

interface User {
  nome: string;
  role?: string;
  finoraUtmAtivo?: boolean;
}

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

export default function LinksPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [utmAtivo, setUtmAtivo] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [tipoLink, setTipoLink] = useState('');
  const [planoSelecionado, setPlanoSelecionado] = useState('');
  const [paginaSelecionada, setPaginaSelecionada] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [linkGerado, setLinkGerado] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [links, setLinks] = useState<LinkSalvo[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      setUtmAtivo(u.finoraUtmAtivo === true);
      if (u.finoraUtmAtivo) {
        carregarProdutos(token);
        carregarLinks(token);
      }
    }
  }, [router]);

  const carregarProdutos = async (token: string) => {
    try {
      const res = await fetch('/api/produtos', { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) { const data = await res.json(); setProdutos(data.produtos || []); }
    } catch (e) { console.error(e); }
  };

  const carregarLinks = async (token: string) => {
    try {
      const res = await fetch('/api/links-utm', { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) { const data = await res.json(); setLinks(data.links || []); }
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const planosDisponiveis = produtoSelecionado
    ? produtos.find(p => p.id === produtoSelecionado)?.planos || []
    : [];

  const paginasDisponiveis = produtoSelecionado
    ? produtos.find(p => p.id === produtoSelecionado)?.paginasOfertas || []
    : [];

  const gerarLink = () => {
    if (!utmSource) { alert('utm_source e obrigatorio'); return; }
    let base = '';
    if (tipoLink === 'pagina') {
      if (!paginaSelecionada) { alert('Selecione uma pagina de vendas'); return; }
      base = paginaSelecionada;
    } else if (tipoLink === 'checkout') {
      if (!planoSelecionado) { alert('Selecione um plano'); return; }
      const plano = planosDisponiveis.find(p => p.id === planoSelecionado);
      if (!plano) return;
      base = 'https://finorapayments.com/checkout/' + plano.linkUnico;
    } else {
      alert('Selecione o tipo de link'); return;
    }
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
        body: JSON.stringify({
          nome: nomeCampanha || (utmSource + ' - ' + (utmCampaign || 'sem campanha')),
          urlDestino,
          utmSource,
          utmMedium,
          utmCampaign,
          urlFinal: linkGerado,
          produtoId: produtoSelecionado || null
        })
      });
      if (res.ok) {
        alert('Link salvo!');
        const t = localStorage.getItem('token');
        if (t) carregarLinks(t);
        setLinkGerado('');
        setNomeCampanha('');
        setUtmSource('');
        setUtmMedium('');
        setUtmCampaign('');
      }
    } catch (e) { alert('Erro ao salvar'); }
    setSalvando(false);
  };

  const copiar = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const removerLink = async (id: string) => {
    if (!confirm('Remover este link?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/links-utm?id=' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
      setLinks(links.filter(l => l.id !== id));
    } catch (e) { alert('Erro ao remover'); }
  };

  const presets = [
    { label: 'Facebook Ads', source: 'facebook', medium: 'cpc' },
    { label: 'Instagram Ads', source: 'instagram', medium: 'cpc' },
    { label: 'Google Ads', source: 'google', medium: 'cpc' },
    { label: 'WhatsApp', source: 'whatsapp', medium: 'social' },
    { label: 'Email', source: 'email', medium: 'email' },
    { label: 'TikTok', source: 'tiktok', medium: 'cpc' },
  ];

  if (!utmAtivo) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={40} className="text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Finora UTM</h2>
            <p className="text-gray-600 mb-6">
              Esta funcionalidade e um modulo adicional do Finora. Entre em contato com o suporte para ativar o Finora UTM na sua conta.
            </p>
              <a
              href="https://wa.me/SEU_NUMERO"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Falar com suporte
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-3">
            <Link2 size={24} className="text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Links UTM</h1>
              <p className="text-sm text-gray-500">Gere e salve links rastreados para suas campanhas</p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Gerar novo link</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Produto</label>
              <select
                value={produtoSelecionado}
                onChange={(e) => { setProdutoSelecionado(e.target.value); setPlanoSelecionado(''); setPaginaSelecionada(''); setTipoLink(''); }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none bg-white text-gray-900"
              >
                <option value="">Selecione um produto</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            {produtoSelecionado && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Link</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <button type="button" onClick={() => { setTipoLink('pagina'); setPlanoSelecionado(''); }}
                    className={'p-4 rounded-xl border-2 text-left transition ' + (tipoLink === 'pagina' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300')}>
                    <div className="text-2xl mb-2">??</div>
                    <div className="font-bold text-gray-900">Pagina de Vendas</div>
                    <div className="text-xs text-gray-500 mt-1">Link para sua pagina de vendas</div>
                  </button>
                  <button type="button" onClick={() => { setTipoLink('checkout'); setPaginaSelecionada(''); }}
                    className={'p-4 rounded-xl border-2 text-left transition ' + (tipoLink === 'checkout' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300')}>
                    <div className="text-2xl mb-2">??</div>
                    <div className="font-bold text-gray-900">Checkout Direto</div>
                    <div className="text-xs text-gray-500 mt-1">Link direto para o checkout com UTMs</div>
                  </button>
                </div>
              </div>
            )}

            {tipoLink === 'pagina' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pagina de Vendas</label>
                <select value={paginaSelecionada} onChange={(e) => setPaginaSelecionada(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none bg-white text-gray-900">
                  <option value="">Selecione uma pagina</option>
                  {paginasDisponiveis.map(p => (
                    <option key={p.id} value={p.link}>{p.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {tipoLink === 'checkout' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Plano / Checkout</label>
                <select value={planoSelecionado} onChange={(e) => setPlanoSelecionado(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none bg-white text-gray-900">
                  <option value="">Selecione um plano</option>
                  {planosDisponiveis.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {tipoLink && (
              <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plataforma (atalho)</label>
                  <div className="flex flex-wrap gap-2">
                    {presets.map(p => (
                      <button key={p.label} onClick={() => { setUtmSource(p.source); setUtmMedium(p.medium); }}
                        className={'px-3 py-1.5 rounded-lg text-sm font-medium border transition ' + (utmSource === p.source && utmMedium === p.medium ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400')}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">utm_source *</label>
                    <input type="text" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="ex: facebook"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">utm_medium</label>
                    <input type="text" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="ex: cpc"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">utm_campaign</label>
                    <input type="text" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="ex: lancamento-maio"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome para identificar este link</label>
                  <input type="text" value={nomeCampanha} onChange={(e) => setNomeCampanha(e.target.value)} placeholder="ex: Facebook Ads - Lancamento Maio"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
                </div>

                <button onClick={gerarLink} className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2">
                  <Link2 size={20} />
                  Gerar Link com UTM
                </button>

                {linkGerado && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-green-700 font-semibold text-sm">Link gerado!</span>
                      <div className="flex gap-2">
                        <button onClick={() => copiar(linkGerado)} className="flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-50 transition">
                          {copiado ? <Check size={16} /> : <Copy size={16} />}
                          {copiado ? 'Copiado!' : 'Copiar'}
                        </button>
                        <button onClick={salvarLink} disabled={salvando} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                          {salvando ? 'Salvando...' : 'Salvar link'}
                        </button>
                      </div>
                    </div>
                    <div className="bg-white border border-green-200 rounded-lg px-4 py-3 font-mono text-sm text-gray-800 break-all">
                      {linkGerado}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {links.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Links salvos</h2>
                <span className="text-sm text-gray-500">{links.length} link{links.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {links.map(link => (
                  <div key={link.id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-gray-900">{link.nome}</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded">{link.utmSource}</span>
                          {link.utmCampaign && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded">{link.utmCampaign}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mb-2">{new Date(link.createdAt).toLocaleString('pt-BR')}</div>
                        <div className="font-mono text-xs text-gray-600 break-all bg-gray-50 rounded px-3 py-2">{link.urlFinal}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => copiar(link.urlFinal)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Copiar">
                          <Copy size={18} />
                        </button>
                        <button onClick={() => removerLink(link.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Remover">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
