'use client';

import Sidebar from '@/app/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';

interface User { nome: string; role?: string; }

interface IntegracaoBling {
  id: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  ativo: boolean;
  emiteNFAutomatico: boolean;
  serieNF: string;
  naturezaOperacao: string;
}

const integracoes = [
  {
    id: 'bling',
    nome: 'Bling ERP',
    descricao: 'Emissão automática de NF-e a cada venda aprovada',
    categoria: 'Fiscal',
    cor: 'blue',
    disponivel: true,
    logo: (
      <svg viewBox="0 0 60 60" className="w-10 h-10" fill="none">
        <rect width="60" height="60" rx="12" fill="#0052CC"/>
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">B</text>
      </svg>
    )
  },
  {
    id: 'sms_funnel',
    nome: 'SMS Funnel',
    descricao: 'Envie SMS automáticos para seus clientes após a compra',
    categoria: 'Comunicação',
    cor: 'green',
    disponivel: false,
    logo: (
      <svg viewBox="0 0 60 60" className="w-10 h-10" fill="none">
        <rect width="60" height="60" rx="12" fill="#16a34a"/>
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">SMS</text>
      </svg>
    )
  },
  {
    id: 'whatsapp',
    nome: 'WhatsApp Business',
    descricao: 'Automatize mensagens de WhatsApp para vendas e suporte',
    categoria: 'Comunicação',
    cor: 'green',
    disponivel: false,
    logo: (
      <svg viewBox="0 0 60 60" className="w-10 h-10" fill="none">
        <rect width="60" height="60" rx="12" fill="#25D366"/>
        <path d="M30 12C19.95 12 11.76 20.19 11.76 30.24C11.76 33.72 12.75 36.96 14.46 39.69L12 48L20.58 45.57C23.22 47.1 26.28 48 29.97 48C40.02 48 48.21 39.81 48.21 29.76C48.24 19.74 40.05 12 30 12Z" fill="white"/>
      </svg>
    )
  },
  {
    id: 'activecampaign',
    nome: 'ActiveCampaign',
    descricao: 'Adicione compradores automaticamente em suas listas de email',
    categoria: 'Email Marketing',
    cor: 'purple',
    disponivel: false,
    logo: (
      <svg viewBox="0 0 60 60" className="w-10 h-10" fill="none">
        <rect width="60" height="60" rx="12" fill="#356AE6"/>
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">AC</text>
      </svg>
    )
  },
  {
    id: 'rd_station',
    nome: 'RD Station',
    descricao: 'Sincronize leads e vendas com o RD Station Marketing',
    categoria: 'CRM',
    cor: 'orange',
    disponivel: false,
    logo: (
      <svg viewBox="0 0 60 60" className="w-10 h-10" fill="none">
        <rect width="60" height="60" rx="12" fill="#FF5200"/>
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">RD</text>
      </svg>
    )
  },
 {
    id: 'zapier',
    nome: 'Zapier',
    descricao: 'Conecte a Finora com mais de 5.000 aplicativos via Zapier',
    categoria: 'Automação',
    cor: 'orange',
    disponivel: false,
    logo: (
      <svg viewBox="0 0 60 60" className="w-10 h-10" fill="none">
        <rect width="60" height="60" rx="12" fill="#FF4A00"/>
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Za</text>
      </svg>
    )
  },
  {
    id: 'reportana',
    nome: 'Reportana',
    descricao: 'Automação de email e SMS marketing para recuperação de vendas',
    categoria: 'Email Marketing',
    cor: 'purple',
    disponivel: false,
    logo: (
      <svg viewBox="0 0 60 60" className="w-10 h-10" fill="none">
        <rect width="60" height="60" rx="12" fill="#7C3AED"/>
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">RPT</text>
      </svg>
    )
  },
  {
    id: 'correios',
    nome: 'Correios',
    descricao: 'Cálculo de frete e rastreamento automático para produtos físicos',
    categoria: 'Logística',
    cor: 'blue',
    disponivel: false,
    logo: (
      <svg viewBox="0 0 60 60" className="w-10 h-10" fill="none">
        <rect width="60" height="60" rx="12" fill="#FFCB05"/>
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#003399" fontSize="12" fontWeight="bold">ECT</text>
      </svg>
    )
  }
];

export default function IntegracoesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [integracaoAtiva, setIntegracaoAtiva] = useState<string | null>(null);
  const [integracao, setIntegracao] = useState<IntegracaoBling | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    clientId: '', clientSecret: '', serieNF: '1',
    naturezaOperacao: 'Venda de mercadoria', emiteNFAutomatico: true
  });
  const [mostrarSecret, setMostrarSecret] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) setUser(JSON.parse(userData));
    carregarIntegracao();
  }, []);

  const carregarIntegracao = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/integracoes/bling', { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) {
        const data = await res.json();
        if (data.integracao) {
          setIntegracao(data.integracao);
          setForm({ clientId: data.integracao.clientId, clientSecret: data.integracao.clientSecret, serieNF: data.integracao.serieNF, naturezaOperacao: data.integracao.naturezaOperacao, emiteNFAutomatico: data.integracao.emiteNFAutomatico });
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const salvarIntegracao = async () => {
    if (!form.clientId || !form.clientSecret) { alert('Preencha o Client ID e Client Secret'); return; }
    setSalvando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/integracoes/bling', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { alert('✅ Integração salva!'); carregarIntegracao(); }
      else alert('❌ Erro: ' + data.error);
    } catch (e) { alert('❌ Erro ao salvar'); }
    setSalvando(false);
  };

  const toggleAtivo = async () => {
    if (!integracao) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/integracoes/bling', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ ativo: !integracao.ativo }) });
      carregarIntegracao();
    } catch (e) { alert('Erro'); }
  };

  const removerIntegracao = async () => {
    if (!confirm('Remover integração com o Bling?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/integracoes/bling', { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
      setIntegracao(null);
      setForm({ clientId: '', clientSecret: '', serieNF: '1', naturezaOperacao: 'Venda de mercadoria', emiteNFAutomatico: true });
      alert('✅ Integração removida!');
    } catch (e) { alert('Erro'); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/'); };

  const corMap: any = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
    green: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-4">
            {integracaoAtiva && (
              <button onClick={() => setIntegracaoAtiva(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition">
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🔌 Integrações</h1>
              <p className="text-sm text-gray-500">{integracaoAtiva ? integracoes.find(i => i.id === integracaoAtiva)?.nome : 'Conecte ferramentas externas à sua conta Finora'}</p>
            </div>
          </div>
        </header>

        <div className="p-8">

          {/* LISTA DE CARDS */}
          {!integracaoAtiva && (
            <div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integracoes.map((item) => {
                  const conectado = item.id === 'bling' && integracao?.accessToken;
                  const cores = corMap[item.cor];
                  return (
                    <div
                      key={item.id}
                      onClick={() => item.disponivel && setIntegracaoAtiva(item.id)}
                      className={`bg-white rounded-2xl border-2 p-6 transition-all relative ${item.disponivel ? 'cursor-pointer hover:shadow-md hover:border-purple-300' : 'opacity-60 cursor-not-allowed border-gray-200'} ${conectado ? 'border-green-300' : 'border-gray-200'}`}
                    >
                      {/* Badge conectado */}
                      {conectado && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          <Check size={12} /> Conectado
                        </div>
                      )}
                      {/* Badge em breve */}
                      {!item.disponivel && (
                        <div className="absolute top-4 right-4 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">
                          Em breve
                        </div>
                      )}

                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl ${cores.bg} ${cores.border} border`}>
                          {item.logo}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{item.nome}</h3>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cores.badge}`}>{item.categoria}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">{item.descricao}</p>

                      {item.disponivel && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <span className="text-sm font-semibold text-purple-600">
                            {conectado ? 'Gerenciar integração →' : 'Configurar →'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DETALHE BLING */}
          {integracaoAtiva === 'bling' && (
            <div className="max-w-3xl">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <svg viewBox="0 0 60 60" className="w-10 h-10" fill="none">
                        <rect width="60" height="60" rx="12" fill="#0052CC"/>
                        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">B</text>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Bling ERP</h2>
                      <p className="text-gray-500 text-sm">Emissão automática de NF-e a cada venda aprovada</p>
                    </div>
                  </div>
                  {integracao && (
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${integracao.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {integracao.ativo ? '✅ Ativo' : '⏸️ Inativo'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={integracao.ativo} onChange={toggleAtivo} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-blue-900 mb-3">📋 Como funciona</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-start gap-2"><span className="font-bold">1.</span><span>Crie uma conta no <strong>Bling ERP</strong> em bling.com.br</span></div>
                  <div className="flex items-start gap-2"><span className="font-bold">2.</span><span>Acesse <strong>Área do Integrador</strong> e crie um aplicativo OAuth</span></div>
                  <div className="flex items-start gap-2"><span className="font-bold">3.</span><span>Na URL de redirecionamento coloque: <code className="bg-blue-100 px-1 rounded text-xs">https://www.finorapayments.com/api/integracoes/bling/callback</code></span></div>
                  <div className="flex items-start gap-2"><span className="font-bold">4.</span><span>Copie o <strong>Client ID</strong> e <strong>Client Secret</strong> e cole abaixo</span></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-6">🔑 Credenciais da API</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Client ID *</label>
                    <input type="text" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} placeholder="Cole seu Client ID do Bling aqui" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Client Secret *</label>
                    <div className="relative">
                      <input type={mostrarSecret ? 'text' : 'password'} value={form.clientSecret} onChange={(e) => setForm({ ...form, clientSecret: e.target.value })} placeholder="Cole seu Client Secret do Bling aqui" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-mono text-sm pr-12" />
                      <button type="button" onClick={() => setMostrarSecret(!mostrarSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                        {mostrarSecret ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-6">📄 Configurações da NF-e</h3>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Série da NF</label>
                      <input type="text" value={form.serieNF} onChange={(e) => setForm({ ...form, serieNF: e.target.value })} placeholder="1" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Natureza da Operação</label>
                      <input type="text" value={form.naturezaOperacao} onChange={(e) => setForm({ ...form, naturezaOperacao: e.target.value })} placeholder="Venda de mercadoria" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-semibold text-gray-900">Emitir NF-e Automaticamente</div>
                      <div className="text-sm text-gray-500">Emite a nota fiscal a cada venda aprovada</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.emiteNFAutomatico} onChange={(e) => setForm({ ...form, emiteNFAutomatico: e.target.checked })} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={salvarIntegracao} disabled={salvando} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {salvando ? 'Salvando...' : '💾 Salvar Configurações'}
                </button>
                {integracao && (
                  <button onClick={removerIntegracao} className="px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition">
                    🗑️ Remover
                  </button>
                )}
              </div>

              <div className="mt-4">
                {integracao?.accessToken ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                    <p className="text-sm text-green-700 font-semibold">✅ Conta Bling conectada com sucesso</p>
                    <button onClick={async () => { const token = localStorage.getItem('token'); const res = await fetch('/api/integracoes/bling/autorizar', { headers: { 'Authorization': 'Bearer ' + token } }); const data = await res.json(); if (data.url) window.location.href = data.url; }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">
                      🔄 Reconectar
                    </button>
                  </div>
                ) : (
                  <button onClick={async () => { if (!integracao) { alert('Salve as configurações primeiro.'); return; } const token = localStorage.getItem('token'); const res = await fetch('/api/integracoes/bling/autorizar', { headers: { 'Authorization': 'Bearer ' + token } }); const data = await res.json(); if (data.url) window.location.href = data.url; else alert('Erro ao gerar link'); }} className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-3 text-lg">
                    🔌 Conectar conta Bling via OAuth
                  </button>
                )}
              </div>

              {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('sucesso') === 'bling_conectado' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-700 font-semibold">✅ Bling conectado com sucesso!</p>
                </div>
              )}
              {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('erro') && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700 font-semibold">❌ Erro: {new URLSearchParams(window.location.search).get('erro')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}