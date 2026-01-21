'use client';

import Sidebar from '@/app/components/Sidebar';

import BannerVerificacao from '@/app/components/BannerVerificacao';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Package, 
  DollarSign, 
  Users, 
  LogOut,
  Wallet,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Smartphone,
  FileText,
  Plus,
  BarChart3, Zap,
  Handshake,
  Inbox,
  ShoppingBag
, Shield , ChevronDown } from 'lucide-react';

interface User {
  id: string;
  nome: string;
  email: string;
  tipo: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [vendasOpen, setVendasOpen] = useState(false);
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
    Pix: {stats.formasPagamento.pix.count},
    Boleto: {stats.formasPagamento.boleto.count}
  }
});

    const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('hoje');

  useEffect(() => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  if (!token || !userData) {
    router.push('/auth/login');
    return;
  }
  setUser(JSON.parse(userData));
  setLoading(false);
  carregarVerificacao();
  carregarEstatisticas(); // ← ADICIONE ESTA LINHA
}, [router]);

  const carregarVerificacao = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        setUserVerificacao({
          verificado: data.user.verificado,
          statusVerificacao: data.user.statusVerificacao
        });
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

const carregarEstatisticas = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/dashboard', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (response.ok) {
      const data = await response.json();
      setStats(data);
    }
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-purple-600 text-xl font-semibold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Olá, {user?.nome}!
              </h1>
              <p className="text-sm text-gray-500">
                Acompanhe suas vendas e métricas em tempo real
              </p>
            </div>

            <div className="flex space-x-2">
              {['Hoje', '7D', '14D', '30D'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p.toLowerCase())}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                    periodo === p.toLowerCase()
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </header>

        <BannerVerificacao user={userVerificacao} onUpdate={carregarVerificacao} />

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">
                  Saldo Disponível
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                  <Wallet size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">R$ {stats.saldo.toFixed(2).replace(".", ",")}</div>
              <div className="text-sm text-gray-500">
                Disponível para saque
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">
                  Total de Vendas
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                  <ShoppingCart size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalVendas}</div>
              <div className="text-sm text-gray-500">Vendas este período</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">
                  Produtos Ativos
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                  <Package size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.produtosAtivos}</div>
              <div className="text-sm text-gray-500">Produtos cadastrados</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">
                  Afiliados
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                  <Users size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.afiliadosAtivos}</div>
              <div className="text-sm text-gray-500">Links ativos</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Formas de Pagamento
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      <CreditCard size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Cartão: {stats.formasPagamento.cartao.count}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    R$ {stats.formasPagamento.cartao.total.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      <Smartphone size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Pix: {stats.formasPagamento.pix.count}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    R$ {stats.formasPagamento.pix.total.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      <FileText size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Boleto: {stats.formasPagamento.boleto.count}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    R$ {stats.formasPagamento.boleto.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Taxa de Aprovação
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full border-4 border-purple-200 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-600">0%</span>
                  </div>
                  <div className="text-xs text-gray-600">Cartão</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full border-4 border-purple-200 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-600">0%</span>
                  </div>
                  <div className="text-xs text-gray-600">Pix</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full border-4 border-purple-200 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-600">0%</span>
                  </div>
                  <div className="text-xs text-gray-600">Boleto</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Ações Rápidas
              </h3>
              <div className="space-y-3">
                <Link href="/dashboard/produtos/novo">
                  <button className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center space-x-2">
                    <Plus size={18} />
                    <span>Criar Produto</span>
                  </button>
                </Link>
                <Link href="/dashboard/vendas">
                  <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center space-x-2">
                    <BarChart3 size={18} />
                    <span>Ver Vendas</span>
                  </button>
                </Link>

          <Link href="/dashboard/carteira">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition">
              <Wallet size={20} />
              <span>Carteira</span>
            </div>
          </Link>
                <Link href="/dashboard/afiliados">
                  <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center space-x-2">
                    <Handshake size={18} />
                    <span>Afiliados</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Atividade Recente
            </h3>
            <div className="text-center py-12">
              <Inbox size={64} className="mx-auto text-gray-300 mb-4" />
              <div className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma atividade ainda
              </div>
              <div className="text-sm text-gray-500">
                Suas vendas e transações aparecerão aqui
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



