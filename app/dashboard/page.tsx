'use client';

import Sidebar from '@/app/components/Sidebar';
import BannerVerificacao from '@/app/components/BannerVerificacao';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, Wallet, ShoppingCart, Plus, BarChart3, 
  Handshake, Inbox, Calendar, ChevronDown
} from 'lucide-react';

interface User {
  id: string;
  nome: string;
  email: string;
  tipo: string;
}

interface Stats {
  pedidosGerados: { count: number; valor: number };
  padAprovado: { count: number; valor: number };
  aguardandoEnvio: { count: number; valor: number };
  entregue: { count: number; valor: number };
  cancelados: { count: number; valor: number };
  saldo: number;
  produtosAtivos: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userVerificacao, setUserVerificacao] = useState({ verificado: false, statusVerificacao: 'PENDENTE' });
  const [stats, setStats] = useState<Stats>({
    pedidosGerados: { count: 0, valor: 0 },
    padAprovado: { count: 0, valor: 0 },
    aguardandoEnvio: { count: 0, valor: 0 },
    entregue: { count: 0, valor: 0 },
    cancelados: { count: 0, valor: 0 },
    saldo: 0,
    produtosAtivos: 0
  });
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    
    // Definir data padrão (hoje)
    const hoje = new Date().toISOString().split('T')[0];
    setDataInicio(hoje);
    setDataFim(hoje);
    
    setLoading(false);
    carregarVerificacao();
  }, [router]);

  useEffect(() => {
    if (dataInicio && dataFim) {
      carregarEstatisticas();
    }
  }, [dataInicio, dataFim]);

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
      const response = await fetch(`/api/dashboard/stats?dataInicio=${dataInicio}&dataFim=${dataFim}`, {
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

  const formatarData = (data: string) => {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
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
              <h1 className="text-2xl font-bold text-gray-900">Olá, {user?.nome}!</h1>
              <p className="text-sm text-gray-500">Acompanhe suas vendas e métricas em tempo real</p>
            </div>

            {/* FILTRO DE DATA */}
            <div className="relative">
              <button
                onClick={() => setMostrarCalendario(!mostrarCalendario)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Calendar size={20} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {dataInicio === dataFim 
                    ? formatarData(dataInicio)
                    : `${formatarData(dataInicio)} - ${formatarData(dataFim)}`
                  }
                </span>
                <ChevronDown size={16} className="text-gray-600" />
              </button>

              {mostrarCalendario && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-10 w-80">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Data Início</label>
                      <input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Data Fim</label>
                      <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <button
                      onClick={() => setMostrarCalendario(false)}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <BannerVerificacao user={userVerificacao} onUpdate={carregarVerificacao} />

        <div className="p-8">
          {/* CARDS DE ESTATÍSTICAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {/* PEDIDOS GERADOS */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart size={20} className="text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                R$ {stats.pedidosGerados.valor.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-600 font-medium">Pedidos gerados</div>
              <div className="text-xs text-gray-500 mt-1">{stats.pedidosGerados.count} unidades</div>
            </div>

            {/* PAD APROVADO */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-yellow-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                R$ {stats.padAprovado.valor.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-600 font-medium">PAD aprovado</div>
              <div className="text-xs text-gray-500 mt-1">{stats.padAprovado.count} unidades</div>
            </div>

            {/* AGUARDANDO ENVIO */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                R$ {stats.aguardandoEnvio.valor.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-600 font-medium">Aguardando envio</div>
              <div className="text-xs text-gray-500 mt-1">{stats.aguardandoEnvio.count} unidades</div>
            </div>

            {/* ENTREGUE */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                R$ {stats.entregue.valor.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-600 font-medium">Entregue</div>
              <div className="text-xs text-gray-500 mt-1">{stats.entregue.count} unidades</div>
            </div>

            {/* CANCELADOS */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-red-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                R$ {stats.cancelados.valor.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-600 font-medium">Cancelados</div>
              <div className="text-xs text-gray-500 mt-1">{stats.cancelados.count} unidades</div>
            </div>
          </div>
          {/* AÇÕES RÁPIDAS E ATIVIDADE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
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
                <Link href="/dashboard/pad">
                  <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center space-x-2">
                    <Package size={18} />
                    <span>Pedidos PAD</span>
                  </button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Atividade Recente</h3>
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
        </div>
      </main>
    </div>
  );
}