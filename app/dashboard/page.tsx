'use client';

import Sidebar from '@/app/components/Sidebar';
import BannerVerificacao from '@/app/components/BannerVerificacao';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wallet, ShoppingCart, Package, Users, CreditCard, Smartphone, FileText, Plus, BarChart3, Handshake, Inbox } from 'lucide-react';
import LoadingScreen from '@/app/components/LoadingScreen';

interface User {
  id: string;
  nome: string;
  email: string;
  tipo: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userVerificacao, setUserVerificacao] = useState({ verificado: false, statusVerificacao: 'PENDENTE' });
  const [stats, setStats] = useState({
    saldo: 0,
    totalVendas: 0,
    produtosAtivos: 0,
    afiliadosAtivos: 0,
    formasPagamento: {
      cartao: { count: 0, total: 0 },
      pix: { count: 0, total: 0 },
      boleto: { count: 0, total: 0 }
    },
    taxasAprovacao: {
      cartao: 0,
      pix: 0,
      boleto: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('hoje');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [atividadesRecentes, setAtividadesRecentes] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/auth/login'); return; }
    setUser(JSON.parse(userData));
    setLoading(false);
    carregarVerificacao();
    carregarEstatisticas();
    carregarAtividades();
   }, [router, periodo, dataInicio, dataFim]);

  const carregarVerificacao = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
      if (response.ok) {
        const data = await response.json();
        setUserVerificacao({ verificado: data.user.verificado, statusVerificacao: data.user.statusVerificacao });
      }
    } catch (error) { console.error('Erro:', error); }
  };
  
   const carregarAtividades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vendas?limit=10&status=PAGO', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        setAtividadesRecentes(data.vendas || []);
      }
    } catch (error) { console.error('Erro ao carregar atividades:', error); }
  };
  
  const carregarEstatisticas = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ periodo });
if (dataInicio) params.set('dataInicio', dataInicio);
if (dataFim) params.set('dataFim', dataFim);
const response = await fetch(`/api/dashboard?${params.toString()}`, { headers: { 'Authorization': 'Bearer ' + token } });
      if (response.ok) { const data = await response.json(); setStats(data); }
    } catch (error) { console.error('Erro ao carregar estatísticas:', error); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Olá, {user?.nome}!</h1>
              <p className="text-sm text-gray-500">Acompanhe suas vendas e métricas em tempo real</p>
            </div>
            <div className="flex items-center gap-2">
              {['Hoje', '7D', '14D', '30D'].map((p) => (
                <button key={p} onClick={() => { setPeriodo(p.toLowerCase()); setDataInicio(''); setDataFim(''); }}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${periodo === p.toLowerCase() && !dataInicio ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {p}
                </button>
              ))}
              <div className="flex items-center gap-1 ml-2">
                <input type="date" value={dataInicio} onChange={e => { setDataInicio(e.target.value); setPeriodo(''); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-600 outline-none" />
                <span className="text-gray-400 text-sm">até</span>
                <input type="date" value={dataFim} onChange={e => { setDataFim(e.target.value); setPeriodo(''); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-600 outline-none" />
              </div>
            </div>
          </div>
        </header>

        <BannerVerificacao user={userVerificacao} onUpdate={carregarVerificacao} />

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Faturamento</div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600"><Wallet size={20} /></div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">R$ {(stats as any).faturamento?.toFixed(2).replace('.', ',') || '0,00'}</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Total de Vendas</div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600"><ShoppingCart size={20} /></div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalVendas}</div>
              <div className="text-sm text-gray-500">Vendas este período</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Produtos Ativos</div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600"><Package size={20} /></div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.produtosAtivos}</div>
              <div className="text-sm text-gray-500">Produtos cadastrados</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Afiliados</div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600"><Users size={20} /></div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.afiliadosAtivos}</div>
              <div className="text-sm text-gray-500">Links ativos</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Formas de Pagamento</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600"><CreditCard size={16} /></div>
                    <span className="text-sm font-medium text-gray-700">Cartão: {stats.formasPagamento.cartao.count}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">R$ {stats.formasPagamento.cartao.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600"><Smartphone size={16} /></div>
                    <span className="text-sm font-medium text-gray-700">Pix: {stats.formasPagamento.pix.count}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">R$ {stats.formasPagamento.pix.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600"><FileText size={16} /></div>
                    <span className="text-sm font-medium text-gray-700">Boleto: {stats.formasPagamento.boleto.count}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">R$ {stats.formasPagamento.boleto.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Taxa de Aprovação</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full border-4 border-purple-200 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-600">{stats.taxasAprovacao.cartao}%</span>
                  </div>
                  <div className="text-xs text-gray-600">Cartão</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full border-4 border-purple-200 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-600">{stats.taxasAprovacao.pix}%</span>
                  </div>
                  <div className="text-xs text-gray-600">Pix</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full border-4 border-purple-200 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-600">{stats.taxasAprovacao.boleto}%</span>
                  </div>
                  <div className="text-xs text-gray-600">Boleto</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <Link href="/dashboard/produtos/novo">
                  <button className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center space-x-2">
                    <Plus size={18} /><span>Criar Produto</span>
                  </button>
                </Link>
                <Link href="/dashboard/vendas">
                  <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center space-x-2">
                    <BarChart3 size={18} /><span>Ver Vendas</span>
                  </button>
                </Link>
                <Link href="/dashboard/carteira">
                  <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center space-x-2">
                    <Wallet size={18} /><span>Carteira</span>
                  </button>
                </Link>
                <Link href="/dashboard/afiliados">
                  <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center space-x-2">
                    <Handshake size={18} /><span>Afiliados</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Atividade Recente</h3>
              <Link href="/dashboard/vendas" className="text-sm text-purple-600 hover:underline font-semibold">Ver todas →</Link>
            </div>
            {atividadesRecentes.length === 0 ? (
              <div className="text-center py-12">
                <Inbox size={64} className="mx-auto text-gray-300 mb-4" />
                <div className="text-lg font-semibold text-gray-900 mb-2">Nenhuma atividade ainda</div>
                <div className="text-sm text-gray-500">Suas vendas e transações aparecerão aqui</div>
              </div>
            ) : (
              <div className="space-y-3">
                {atividadesRecentes.map((venda: any) => (
                  <div key={venda.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                        venda.metodoPagamento === 'PIX' ? 'bg-green-500' :
                        venda.metodoPagamento === 'CARTAO' ? 'bg-purple-500' : 'bg-orange-500'
                      }`}>
                        {venda.metodoPagamento === 'PIX' ? '₱' : venda.metodoPagamento === 'CARTAO' ? '💳' : '📄'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{venda.compradorNome}</div>
                        <div className="text-xs text-gray-500">{venda.nomePlano || venda.produto?.nome || 'Produto'}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(venda.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 text-sm">+ R$ {venda.valor.toFixed(2).replace('.', ',')}</div>
                      <div className={`text-xs px-2 py-1 rounded-full font-semibold mt-1 ${
                        venda.status === 'PAGO' ? 'bg-green-100 text-green-700' :
                        venda.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                      }`}>{venda.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}