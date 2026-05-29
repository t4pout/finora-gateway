'use client';

import Sidebar from '@/app/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  nome: string;
  role?: string;
}

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

export default function IntegracoesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [integracao, setIntegracao] = useState<IntegracaoBling | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    clientId: '',
    clientSecret: '',
    serieNF: '1',
    naturezaOperacao: 'Venda de mercadoria',
    emiteNFAutomatico: true
  });
  const [mostrarSecret, setMostrarSecret] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('bling');

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
      const res = await fetch('/api/integracoes/bling', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.integracao) {
          setIntegracao(data.integracao);
          setForm({
            clientId: data.integracao.clientId,
            clientSecret: data.integracao.clientSecret,
            serieNF: data.integracao.serieNF,
            naturezaOperacao: data.integracao.naturezaOperacao,
            emiteNFAutomatico: data.integracao.emiteNFAutomatico
          });
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const salvarIntegracao = async () => {
    if (!form.clientId || !form.clientSecret) {
      alert('Preencha o Client ID e Client Secret');
      return;
    }
    setSalvando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/integracoes/bling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Integração salva com sucesso!');
        carregarIntegracao();
      } else {
        alert('❌ Erro: ' + data.error);
      }
    } catch (e) {
      alert('❌ Erro ao salvar');
    }
    setSalvando(false);
  };

  const toggleAtivo = async () => {
    if (!integracao) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/integracoes/bling', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ ativo: !integracao.ativo })
      });
      carregarIntegracao();
    } catch (e) { alert('Erro'); }
  };

  const removerIntegracao = async () => {
    if (!confirm('Tem certeza que deseja remover a integração com o Bling?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/integracoes/bling', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      setIntegracao(null);
      setForm({ clientId: '', clientSecret: '', serieNF: '1', naturezaOperacao: 'Venda de mercadoria', emiteNFAutomatico: true });
      alert('✅ Integração removida!');
    } catch (e) { alert('Erro'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🔌 Integrações</h1>
            <p className="text-sm text-gray-500">Conecte ferramentas externas à sua conta Finora</p>
          </div>
        </header>

        <div className="p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setAbaAtiva('bling')}
              className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${abaAtiva === 'bling' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <span>📊</span> Bling (NF-e)
            </button>
            <button
              onClick={() => setAbaAtiva('outros')}
              className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${abaAtiva === 'outros' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <span>🔧</span> Em breve...
            </button>
          </div>

          {abaAtiva === 'bling' && (
            <div className="max-w-3xl">
              {/* Header do Bling */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">
                      📊
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

              {/* Como funciona */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-blue-900 mb-3">📋 Como funciona</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    <span>Crie uma conta no <strong>Bling ERP</strong> em bling.com.br</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold">2.</span>
                    <span>Acesse <strong>Configurações → API</strong> e crie um aplicativo OAuth</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold">3.</span>
                    <span>Copie o <strong>Client ID</strong> e <strong>Client Secret</strong> gerados</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold">4.</span>
                    <span>Cole abaixo e salve — a NF-e será emitida automaticamente a cada venda paga</span>
                  </div>
                </div>
              </div>

              {/* Formulário */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-6">🔑 Credenciais da API</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Client ID *</label>
                    <input
                      type="text"
                      value={form.clientId}
                      onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                      placeholder="Cole seu Client ID do Bling aqui"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Client Secret *</label>
                    <div className="relative">
                      <input
                        type={mostrarSecret ? 'text' : 'password'}
                        value={form.clientSecret}
                        onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
                        placeholder="Cole seu Client Secret do Bling aqui"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-mono text-sm pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSecret(!mostrarSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {mostrarSecret ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configurações NF-e */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-6">📄 Configurações da NF-e</h3>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Série da NF</label>
                      <input
                        type="text"
                        value={form.serieNF}
                        onChange={(e) => setForm({ ...form, serieNF: e.target.value })}
                        placeholder="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Natureza da Operação</label>
                      <input
                        type="text"
                        value={form.naturezaOperacao}
                        onChange={(e) => setForm({ ...form, naturezaOperacao: e.target.value })}
                        placeholder="Venda de mercadoria"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      />
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

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={salvarIntegracao}
                  disabled={salvando}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : '💾 Salvar Configurações'}
                </button>
                {integracao && (
                  <button
                    onClick={removerIntegracao}
                    className="px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition"
                  >
                    🗑️ Remover
                  </button>
                )}
              </div>

              {/* Botão OAuth */}
              <div className="mt-4">
                {integracao?.accessToken ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                    <p className="text-sm text-green-700 font-semibold">✅ Conta Bling conectada com sucesso</p>
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem('token');
                        const res = await fetch('/api/integracoes/bling/autorizar', {
                          headers: { 'Authorization': 'Bearer ' + token }
                        });
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                    >
                      🔄 Reconectar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      if (!integracao) {
                        alert('Salve as configurações primeiro antes de conectar.');
                        return;
                      }
                      const token = localStorage.getItem('token');
                      const res = await fetch('/api/integracoes/bling/autorizar', {
                        headers: { 'Authorization': 'Bearer ' + token }
                      });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                      else alert('Erro ao gerar link de autorização');
                    }}
                    className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-3 text-lg"
                  >
                    🔌 Conectar conta Bling via OAuth
                  </button>
                )}
              </div>

              {/* Alerta de erro/sucesso da URL */}
              {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('sucesso') === 'bling_conectado' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-700 font-semibold">✅ Bling conectado com sucesso!</p>
                </div>
              )}
              {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('erro') && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700 font-semibold">❌ Erro ao conectar: {new URLSearchParams(window.location.search).get('erro')}</p>
                </div>
              )}
            </div>
          )}

          {abaAtiva === 'outros' && (
            <div className="max-w-3xl">
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mais integrações em breve</h3>
                <p className="text-gray-500">Estamos trabalhando para trazer mais integrações como NFSe, Omie, ContaAzul e outras ferramentas.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}