'use client';

import Sidebar from '@/app/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit, X, Check } from 'lucide-react';

interface User { nome: string; role?: string; }

interface Webhook {
  id: string;
  nome: string;
  url: string;
  ativo: boolean;
  eventos: string[];
  secret?: string;
  logs: { sucesso: boolean; statusCode: number; createdAt: string }[];
}

interface Postback {
  id: string;
  nome: string;
  url: string;
  metodo: string;
  ativo: boolean;
  eventos: string[];
  logs: { sucesso: boolean; statusCode: number; urlDisparada: string; createdAt: string }[];
}

const EVENTOS_DISPONIVEIS = [
  { value: 'VENDA_PAGA', label: '✅ Venda Paga' },
  { value: 'VENDA_CANCELADA', label: '❌ Venda Cancelada' },
  { value: 'VENDA_PENDENTE', label: '⏳ Venda Pendente' },
];

const VARIAVEIS_DISPONIVEIS = [
  { var: '{vendaId}', desc: 'ID da venda' },
  { var: '{produtoNome}', desc: 'Nome do produto' },
  { var: '{produtoId}', desc: 'ID do produto' },
  { var: '{valor}', desc: 'Valor bruto' },
  { var: '{valorLiquido}', desc: 'Valor líquido' },
  { var: '{compradorNome}', desc: 'Nome do comprador' },
  { var: '{compradorEmail}', desc: 'Email do comprador' },
  { var: '{compradorCpf}', desc: 'CPF do comprador' },
  { var: '{compradorTel}', desc: 'Telefone do comprador' },
  { var: '{metodoPagamento}', desc: 'Método de pagamento' },
  { var: '{status}', desc: 'Status da venda' },
  { var: '{utmSource}', desc: 'UTM Source' },
  { var: '{utmMedium}', desc: 'UTM Medium' },
  { var: '{utmCampaign}', desc: 'UTM Campaign' },
  { var: '{timestamp}', desc: 'Data/hora do evento' },
];

export default function FerramentasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [aba, setAba] = useState('webhooks');
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [postbacks, setPostbacks] = useState<Postback[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalWebhook, setModalWebhook] = useState(false);
  const [modalPostback, setModalPostback] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);
  const [logSelecionado, setLogSelecionado] = useState<any>(null);

  const [formWebhook, setFormWebhook] = useState({
    nome: '', url: '', secret: '', eventos: ['VENDA_PAGA']
  });

  const [formPostback, setFormPostback] = useState({
    nome: '', url: '', metodo: 'GET', eventos: ['VENDA_PAGA']
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) setUser(JSON.parse(userData));
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const token = localStorage.getItem('token');
    try {
      const [resW, resP] = await Promise.all([
        fetch('/api/ferramentas/webhooks', { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch('/api/ferramentas/postbacks', { headers: { 'Authorization': 'Bearer ' + token } })
      ]);
      if (resW.ok) { const d = await resW.json(); setWebhooks(d.webhooks || []); }
      if (resP.ok) { const d = await resP.json(); setPostbacks(d.postbacks || []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const salvarWebhook = async () => {
    if (!formWebhook.nome || !formWebhook.url) { alert('Preencha nome e URL'); return; }
    setSalvando(true);
    const token = localStorage.getItem('token');
    const method = editando ? 'PATCH' : 'POST';
    const body = editando ? { ...formWebhook, id: editando.id } : formWebhook;
    const res = await fetch('/api/ferramentas/webhooks', {
      method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body)
    });
    if (res.ok) { alert(editando ? '✅ Atualizado!' : '✅ Criado!'); setModalWebhook(false); setEditando(null); setFormWebhook({ nome: '', url: '', secret: '', eventos: ['VENDA_PAGA'] }); carregarDados(); }
    else { const d = await res.json(); alert('❌ ' + d.error); }
    setSalvando(false);
  };

  const salvarPostback = async () => {
    if (!formPostback.nome || !formPostback.url) { alert('Preencha nome e URL'); return; }
    setSalvando(true);
    const token = localStorage.getItem('token');
    const method = editando ? 'PATCH' : 'POST';
    const body = editando ? { ...formPostback, id: editando.id } : formPostback;
    const res = await fetch('/api/ferramentas/postbacks', {
      method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body)
    });
    if (res.ok) { alert(editando ? '✅ Atualizado!' : '✅ Criado!'); setModalPostback(false); setEditando(null); setFormPostback({ nome: '', url: '', metodo: 'GET', eventos: ['VENDA_PAGA'] }); carregarDados(); }
    else { const d = await res.json(); alert('❌ ' + d.error); }
    setSalvando(false);
  };

  const excluirWebhook = async (id: string) => {
    if (!confirm('Excluir este webhook?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/ferramentas/webhooks?id=${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    carregarDados();
  };

  const excluirPostback = async (id: string) => {
    if (!confirm('Excluir este postback?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/ferramentas/postbacks?id=${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    carregarDados();
  };

  const toggleWebhook = async (id: string, ativo: boolean) => {
    const token = localStorage.getItem('token');
    await fetch('/api/ferramentas/webhooks', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ id, ativo }) });
    carregarDados();
  };

  const togglePostback = async (id: string, ativo: boolean) => {
    const token = localStorage.getItem('token');
    await fetch('/api/ferramentas/postbacks', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ id, ativo }) });
    carregarDados();
  };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/'); };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-finoradark-bg">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white dark:bg-finoradark-card border-b border-gray-200 dark:border-finoradark-border px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-finoradark-text">🛠️ Ferramentas</h1>
          <p className="text-sm text-gray-500 dark:text-finoradark-textmuted">Webhooks e Postbacks para integrar com sistemas externos</p>
        </header>

        <div className="p-8">
          <div className="flex gap-2 mb-8">
            <button onClick={() => setAba('webhooks')} className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${aba === 'webhooks' ? 'bg-purple-600 dark:bg-finoradark-glow text-white shadow-lg dark:shadow-none' : 'bg-white dark:bg-finoradark-card border border-gray-200 dark:border-finoradark-border text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'}`}>
              🔔 Webhooks
            </button>
            <button onClick={() => setAba('postbacks')} className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${aba === 'postbacks' ? 'bg-purple-600 dark:bg-finoradark-glow text-white shadow-lg dark:shadow-none' : 'bg-white dark:bg-finoradark-card border border-gray-200 dark:border-finoradark-border text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'}`}>
              📡 Postbacks
            </button>
          </div>

          {aba === 'webhooks' && (
            <div className="max-w-4xl">
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-5 mb-6">
                <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-2">🔔 O que é Webhook?</h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">A Finora envia um POST com os dados da venda para a URL cadastrada sempre que um evento ocorrer. Ideal para integrar com CRMs, ERPs, automações e sistemas internos.</p>
                <div className="mt-3 p-3 bg-white dark:bg-finoradark-card rounded-lg border border-blue-200 dark:border-blue-900/40">
                  <p className="text-xs font-mono text-gray-700 dark:text-finoradark-text">POST {`{sua-url}`}<br/>Content-Type: application/json<br/>X-Finora-Signature: sha256=... (se secret configurado)</p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-finoradark-text">Meus Webhooks ({webhooks.length})</h2>
                <button onClick={() => { setEditando(null); setFormWebhook({ nome: '', url: '', secret: '', eventos: ['VENDA_PAGA'] }); setModalWebhook(true); }} className="px-5 py-2.5 bg-purple-600 dark:bg-finoradark-glow text-white rounded-xl font-semibold hover:bg-purple-700 dark:hover:opacity-90 transition flex items-center gap-2">
                  <Plus size={18} /> Novo Webhook
                </button>
              </div>

              {webhooks.length === 0 ? (
                <div className="bg-white dark:bg-finoradark-card rounded-2xl border border-gray-200 dark:border-finoradark-border p-12 text-center">
                  <div className="text-5xl mb-4">🔔</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-finoradark-text mb-2">Nenhum webhook cadastrado</h3>
                  <p className="text-gray-500 dark:text-finoradark-textmuted mb-6">Crie seu primeiro webhook para receber notificações de vendas em tempo real</p>
                  <button onClick={() => setModalWebhook(true)} className="px-6 py-3 bg-purple-600 dark:bg-finoradark-glow text-white rounded-xl font-semibold hover:bg-purple-700 dark:hover:opacity-90 transition">Criar Webhook</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {webhooks.map((wh) => (
                    <div key={wh.id} className="bg-white dark:bg-finoradark-card rounded-2xl border border-gray-200 dark:border-finoradark-border p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-gray-900 dark:text-finoradark-text text-lg">{wh.nome}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${wh.ativo ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-finoradark-card2 text-gray-600 dark:text-finoradark-textmuted'}`}>{wh.ativo ? 'Ativo' : 'Inativo'}</span>
                          </div>
                          <p className="text-sm font-mono text-gray-600 dark:text-finoradark-textmuted break-all">{wh.url}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {wh.eventos.map(e => <span key={e} className="px-2 py-0.5 bg-purple-100 dark:bg-finoradark-card2 text-purple-700 dark:text-finoradark-glow rounded-full text-xs font-semibold">{e}</span>)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={wh.ativo} onChange={(e) => toggleWebhook(wh.id, e.target.checked)} className="sr-only peer" />
                            <div className="w-10 h-5 bg-gray-200 dark:bg-finoradark-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-finoradark-glow"></div>
                          </label>
                          <button onClick={() => { setEditando(wh); setFormWebhook({ nome: wh.nome, url: wh.url, secret: wh.secret || '', eventos: wh.eventos }); setModalWebhook(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-finoradark-card2 rounded-lg transition"><Edit size={16} className="text-gray-600 dark:text-finoradark-textmuted" /></button>
                          <button onClick={() => excluirWebhook(wh.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 size={16} className="text-red-500 dark:text-red-400" /></button>
                        </div>
                      </div>
                      {wh.logs.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-finoradark-textmuted mb-2">ÚLTIMOS DISPAROS</p>
                          <div className="space-y-1">
                            {wh.logs.map((log, i) => (
                              <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-finoradark-card2 rounded-lg text-xs">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${log.sucesso ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                  {log.sucesso ? <Check size={12} className="text-green-600 dark:text-green-400" /> : <X size={12} className="text-red-600 dark:text-red-400" />}
                                </span>
                                <span className={`font-bold ${log.sucesso ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{log.statusCode || 'ERR'}</span>
                                <span className="text-gray-500 dark:text-finoradark-textmuted">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {aba === 'postbacks' && (
            <div className="max-w-4xl">
              <div className="bg-purple-50 dark:bg-finoradark-card2 border border-purple-200 dark:border-finoradark-border rounded-2xl p-5 mb-6">
                <h3 className="font-bold text-purple-900 dark:text-finoradark-text mb-2">📡 O que é Postback?</h3>
                <p className="text-sm text-purple-800 dark:text-finoradark-textmuted">A Finora dispara uma requisição GET ou POST para a URL com variáveis dinâmicas substituídas. Ideal para redes de afiliados, trackers e plataformas de tráfego.</p>
                <div className="mt-3 p-3 bg-white dark:bg-finoradark-card rounded-lg border border-purple-200 dark:border-finoradark-border">
                  <p className="text-xs font-mono text-gray-700 dark:text-finoradark-text">Exemplo: https://tracker.com/pb?valor={'{valor}'}&id={'{vendaId}'}&email={'{compradorEmail}'}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-finoradark-card rounded-2xl border border-gray-200 dark:border-finoradark-border p-5 mb-6">
                <h3 className="font-bold text-gray-900 dark:text-finoradark-text mb-3">📋 Variáveis disponíveis</h3>
                <div className="grid md:grid-cols-3 gap-2">
                  {VARIAVEIS_DISPONIVEIS.map(v => (
                    <div key={v.var} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-finoradark-card2 rounded-lg">
                      <code className="text-xs text-purple-700 dark:text-finoradark-glow font-bold">{v.var}</code>
                      <span className="text-xs text-gray-500 dark:text-finoradark-textmuted">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-finoradark-text">Meus Postbacks ({postbacks.length})</h2>
                <button onClick={() => { setEditando(null); setFormPostback({ nome: '', url: '', metodo: 'GET', eventos: ['VENDA_PAGA'] }); setModalPostback(true); }} className="px-5 py-2.5 bg-purple-600 dark:bg-finoradark-glow text-white rounded-xl font-semibold hover:bg-purple-700 dark:hover:opacity-90 transition flex items-center gap-2">
                  <Plus size={18} /> Novo Postback
                </button>
              </div>

              {postbacks.length === 0 ? (
                <div className="bg-white dark:bg-finoradark-card rounded-2xl border border-gray-200 dark:border-finoradark-border p-12 text-center">
                  <div className="text-5xl mb-4">📡</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-finoradark-text mb-2">Nenhum postback cadastrado</h3>
                  <p className="text-gray-500 dark:text-finoradark-textmuted mb-6">Crie seu primeiro postback para notificar trackers e redes de afiliados</p>
                  <button onClick={() => setModalPostback(true)} className="px-6 py-3 bg-purple-600 dark:bg-finoradark-glow text-white rounded-xl font-semibold hover:bg-purple-700 dark:hover:opacity-90 transition">Criar Postback</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {postbacks.map((pb) => (
                    <div key={pb.id} className="bg-white dark:bg-finoradark-card rounded-2xl border border-gray-200 dark:border-finoradark-border p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-gray-900 dark:text-finoradark-text text-lg">{pb.nome}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pb.ativo ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-finoradark-card2 text-gray-600 dark:text-finoradark-textmuted'}`}>{pb.ativo ? 'Ativo' : 'Inativo'}</span>
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold">{pb.metodo}</span>
                          </div>
                          <p className="text-sm font-mono text-gray-600 dark:text-finoradark-textmuted break-all">{pb.url}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {pb.eventos.map(e => <span key={e} className="px-2 py-0.5 bg-purple-100 dark:bg-finoradark-card2 text-purple-700 dark:text-finoradark-glow rounded-full text-xs font-semibold">{e}</span>)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={pb.ativo} onChange={(e) => togglePostback(pb.id, e.target.checked)} className="sr-only peer" />
                            <div className="w-10 h-5 bg-gray-200 dark:bg-finoradark-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-finoradark-glow"></div>
                          </label>
                          <button onClick={() => { setEditando(pb); setFormPostback({ nome: pb.nome, url: pb.url, metodo: pb.metodo, eventos: pb.eventos }); setModalPostback(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-finoradark-card2 rounded-lg transition"><Edit size={16} className="text-gray-600 dark:text-finoradark-textmuted" /></button>
                          <button onClick={() => excluirPostback(pb.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 size={16} className="text-red-500 dark:text-red-400" /></button>
                        </div>
                      </div>
                      {pb.logs.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-finoradark-textmuted mb-2">ÚLTIMOS DISPAROS</p>
                          <div className="space-y-1">
                            {pb.logs.map((log, i) => (
                              <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-finoradark-card2 rounded-lg text-xs">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${log.sucesso ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                  {log.sucesso ? <Check size={12} className="text-green-600 dark:text-green-400" /> : <X size={12} className="text-red-600 dark:text-red-400" />}
                                </span>
                                <span className={`font-bold ${log.sucesso ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{log.statusCode || 'ERR'}</span>
                                <span className="text-gray-500 dark:text-finoradark-textmuted font-mono truncate max-w-xs">{log.urlDisparada}</span>
                                <span className="text-gray-400 dark:text-finoradark-textmuted">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Webhook */}
      {modalWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setModalWebhook(false)}>
          <div className="bg-white dark:bg-finoradark-card rounded-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-finoradark-text mb-6">{editando ? 'Editar Webhook' : 'Novo Webhook'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">Nome *</label>
                <input type="text" value={formWebhook.nome} onChange={e => setFormWebhook({...formWebhook, nome: e.target.value})} placeholder="Ex: CRM Principal" className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-finoradark-text" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">URL de destino *</label>
                <input type="url" value={formWebhook.url} onChange={e => setFormWebhook({...formWebhook, url: e.target.value})} placeholder="https://seu-sistema.com/webhook" className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-finoradark-text font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">Secret (opcional)</label>
                <input type="text" value={formWebhook.secret} onChange={e => setFormWebhook({...formWebhook, secret: e.target.value})} placeholder="Chave para validar assinatura HMAC" className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-finoradark-text font-mono text-sm" />
                <p className="text-xs text-gray-500 dark:text-finoradark-textmuted mt-1">Se preenchido, enviamos o header X-Finora-Signature com HMAC SHA256</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">Eventos</label>
                <div className="space-y-2">
                  {EVENTOS_DISPONIVEIS.map(ev => (
                    <label key={ev.value} className="flex items-center gap-3 p-3 border dark:border-finoradark-border rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-finoradark-card2">
                      <input type="checkbox" checked={formWebhook.eventos.includes(ev.value)} onChange={e => {
                        if (e.target.checked) setFormWebhook({...formWebhook, eventos: [...formWebhook.eventos, ev.value]});
                        else setFormWebhook({...formWebhook, eventos: formWebhook.eventos.filter(ev2 => ev2 !== ev.value)});
                      }} className="w-4 h-4" />
                      <span className="text-sm font-medium text-gray-900 dark:text-finoradark-text">{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setModalWebhook(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-finoradark-border text-gray-700 dark:text-finoradark-textmuted rounded-xl font-semibold">Cancelar</button>
                <button onClick={salvarWebhook} disabled={salvando} className="flex-1 px-6 py-3 bg-purple-600 dark:bg-finoradark-glow text-white rounded-xl font-semibold hover:bg-purple-700 dark:hover:opacity-90 transition disabled:opacity-50">{salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Postback */}
      {modalPostback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setModalPostback(false)}>
          <div className="bg-white dark:bg-finoradark-card rounded-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-finoradark-text mb-6">{editando ? 'Editar Postback' : 'Novo Postback'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">Nome *</label>
                <input type="text" value={formPostback.nome} onChange={e => setFormPostback({...formPostback, nome: e.target.value})} placeholder="Ex: Tracker Facebook" className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-finoradark-text" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">URL com variáveis *</label>
                <textarea rows={3} value={formPostback.url} onChange={e => setFormPostback({...formPostback, url: e.target.value})} placeholder="https://tracker.com/pb?valor={valor}&id={vendaId}" className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-finoradark-text font-mono text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">Método</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormPostback({...formPostback, metodo: 'GET'})} className={`flex-1 py-2.5 rounded-xl font-semibold border-2 transition ${formPostback.metodo === 'GET' ? 'border-purple-600 dark:border-finoradark-glow bg-purple-50 dark:bg-finoradark-card2 text-purple-700 dark:text-finoradark-glow' : 'border-gray-200 dark:border-finoradark-border text-gray-600 dark:text-finoradark-textmuted'}`}>GET</button>
                  <button type="button" onClick={() => setFormPostback({...formPostback, metodo: 'POST'})} className={`flex-1 py-2.5 rounded-xl font-semibold border-2 transition ${formPostback.metodo === 'POST' ? 'border-purple-600 dark:border-finoradark-glow bg-purple-50 dark:bg-finoradark-card2 text-purple-700 dark:text-finoradark-glow' : 'border-gray-200 dark:border-finoradark-border text-gray-600 dark:text-finoradark-textmuted'}`}>POST</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">Eventos</label>
                <div className="space-y-2">
                  {EVENTOS_DISPONIVEIS.map(ev => (
                    <label key={ev.value} className="flex items-center gap-3 p-3 border dark:border-finoradark-border rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-finoradark-card2">
                      <input type="checkbox" checked={formPostback.eventos.includes(ev.value)} onChange={e => {
                        if (e.target.checked) setFormPostback({...formPostback, eventos: [...formPostback.eventos, ev.value]});
                        else setFormPostback({...formPostback, eventos: formPostback.eventos.filter(ev2 => ev2 !== ev.value)});
                      }} className="w-4 h-4" />
                      <span className="text-sm font-medium text-gray-900 dark:text-finoradark-text">{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setModalPostback(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-finoradark-border text-gray-700 dark:text-finoradark-textmuted rounded-xl font-semibold">Cancelar</button>
                <button onClick={salvarPostback} disabled={salvando} className="flex-1 px-6 py-3 bg-purple-600 dark:bg-finoradark-glow text-white rounded-xl font-semibold hover:bg-purple-700 dark:hover:opacity-90 transition disabled:opacity-50">{salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}