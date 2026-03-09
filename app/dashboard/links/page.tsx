'use client';

import Sidebar from '@/app/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, Copy, Check, Trash2 } from 'lucide-react';

interface User {
  nome: string;
  role?: string;
}

interface Produto {
  id: string;
  nome: string;
  planos: { id: string; nome: string; linkUnico: string }[];
}

interface LinkGerado {
  id: string;
  nome: string;
  url: string;
  criadoEm: string;
}

export default function LinksPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [planoSelecionado, setPlanoSelecionado] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [linkGerado, setLinkGerado] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [links, setLinks] = useState<LinkGerado[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) setUser(JSON.parse(userData));
    carregarProdutos();
    carregarLinksHistorico();
  }, [router]);

  const carregarProdutos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/produtos', { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) {
        const data = await res.json();
        setProdutos(data.produtos || []);
      }
    } catch (e) { console.error(e); }
  };

  const carregarLinksHistorico = () => {
    try {
      const saved = localStorage.getItem('utm_links_historico');
      if (saved) setLinks(JSON.parse(saved));
    } catch (e) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const planosDisponiveis = produtoSelecionado
    ? produtos.find(p => p.id === produtoSelecionado)?.planos || []
    : [];

  const gerarLink = () => {
    if (!planoSelecionado) { alert('Selecione um produto e plano'); return; }
    if (!utmSource) { alert('utm_source é obrigatório'); return; }

    const plano = planosDisponiveis.find(p => p.id === planoSelecionado);
    if (!plano) return;

    const base = `https://finorapayments.com/checkout/${plano.linkUnico}`;
    const params = new URLSearchParams();
    params.set('utm_source', utmSource.trim());
    if (utmMedium.trim()) params.set('utm_medium', utmMedium.trim());
    if (utmCampaign.trim()) params.set('utm_campaign', utmCampaign.trim());

    const url = `${base}?${params.toString()}`;
    setLinkGerado(url);

    const novoLink: LinkGerado = {
      id: Date.now().toString(),
      nome: nomeCampanha || `${utmSource} - ${utmCampaign || 'sem campanha'}`,
      url,
      criadoEm: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    };
    const novos = [novoLink, ...links].slice(0, 20);
    setLinks(novos);
    localStorage.setItem('utm_links_historico', JSON.stringify(novos));
  };

  const copiar = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const removerLink = (id: string) => {
    const novos = links.filter(l => l.id !== id);
    setLinks(novos);
    localStorage.setItem('utm_links_historico', JSON.stringify(novos));
  };

  const presets = [
    { label: 'Facebook Ads', source: 'facebook', medium: 'cpc' },
    { label: 'Instagram Ads', source: 'instagram', medium: 'cpc' },
    { label: 'Google Ads', source: 'google', medium: 'cpc' },
    { label: 'WhatsApp', source: 'whatsapp', medium: 'social' },
    { label: 'Email', source: 'email', medium: 'email' },
    { label: 'TikTok', source: 'tiktok', medium: 'cpc' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-3">
            <Link2 size={24} className="text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Links UTM</h1>
              <p className="text-sm text-gray-500">Gere links rastreados para suas campanhas</p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Gerar novo link</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produto *</label>
                <select
                  value={produtoSelecionado}
                  onChange={(e) => { setProdutoSelecionado(e.target.value); setPlanoSelecionado(''); }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none bg-white text-gray-900"
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plano / Checkout *</label>
                <select
                  value={planoSelecionado}
                  onChange={(e) => setPlanoSelecionado(e.target.value)}
                  disabled={!produtoSelecionado}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none bg-white text-gray-900 disabled:opacity-50"
                >
                  <option value="">Selecione um plano</option>
                  {planosDisponiveis.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Plataforma (atalho)</label>
              <div className="flex flex-wrap gap-2">
                {presets.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setUtmSource(p.source); setUtmMedium(p.medium); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                      utmSource === p.source && utmMedium === p.medium
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">utm_source <span className="text-red-500">*</span></label>
                <input type="text" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="ex: facebook" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
                <p className="text-xs text-gray-400 mt-1">Origem do tráfego</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">utm_medium</label>
                <input type="text" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="ex: cpc" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
                <p className="text-xs text-gray-400 mt-1">Tipo de mídia</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">utm_campaign</label>
                <input type="text" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="ex: lancamento-maio" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
                <p className="text-xs text-gray-400 mt-1">Nome da campanha</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome para identificar este link</label>
              <input type="text" value={nomeCampanha} onChange={(e) => setNomeCampanha(e.target.value)} placeholder="ex: Facebook Ads - Lançamento Maio" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
            </div>

            <button onClick={gerarLink} className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2">
              <Link2 size={20} />
              Gerar Link com UTM
            </button>

            {linkGerado && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-700 font-semibold text-sm">✅ Link gerado com sucesso!</span>
                  <button onClick={() => copiar(linkGerado)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition">
                    {copiado ? <Check size={16} /> : <Copy size={16} />}
                    {copiado ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <div className="bg-white border border-green-200 rounded-lg px-4 py-3 font-mono text-sm text-gray-800 break-all">
                  {linkGerado}
                </div>
              </div>
            )}
          </div>

          {links.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Histórico de links</h2>
                <span className="text-sm text-gray-500">{links.length} link{links.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {links.map(link => (
                  <div key={link.id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 mb-1">{link.nome}</div>
                        <div className="text-xs text-gray-400 mb-2">{link.criadoEm}</div>
                        <div className="font-mono text-xs text-gray-600 break-all bg-gray-50 rounded px-3 py-2">{link.url}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => copiar(link.url)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Copiar"><Copy size={18} /></button>
                        <button onClick={() => removerLink(link.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Remover"><Trash2 size={18} /></button>
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