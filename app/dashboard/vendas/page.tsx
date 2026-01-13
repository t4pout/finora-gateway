'use client';

import Sidebar from '@/app/components/Sidebar';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, DollarSign, Users, LogOut, ShoppingBag, BarChart3, Zap, Filter, Calendar, Wallet, Shield , ChevronDown } from 'lucide-react';

interface Venda {
  id: string;
  valor: number;
  status: string;
  metodoPagamento: string;
  compradorNome: string;
  compradorEmail: string;
  createdAt: string;
  produto: {
    nome: string;
  };
  transacoes?: { valor: number }[];
}

interface User {
  nome: string;
  role?: string;
}

export default function VendasPage() {
  const router = useRouter();
  const [vendasOpen, setVendasOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('TODAS');
  const [filtroData, setFiltroData] = useState('TODAS');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    carregarVendas();
  }, [router]);

  const carregarVendas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vendas', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVendas(data.vendas || []);
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getDataInicio = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    switch (filtroData) {
      case 'HOJE':
        return hoje;
      case 'ONTEM':
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        return ontem;
      case '7D':
        const semana = new Date(hoje);
        semana.setDate(semana.getDate() - 7);
        return semana;
      case '14D':
        const duas = new Date(hoje);
        duas.setDate(duas.getDate() - 14);
        return duas;
      case '30D':
        const mes = new Date(hoje);
        mes.setDate(mes.getDate() - 30);
        return mes;
      default:
        return null;
    }
  };

  const vendasFiltradas = vendas.filter(v => {
    // Filtro de status
    if (filtroStatus !== 'TODAS' && v.status !== filtroStatus) {
      return false;
    }

    // Filtro de data
    const dataInicio = getDataInicio();
    if (dataInicio) {
      const dataVenda = new Date(v.createdAt);
      if (dataVenda < dataInicio) {
        return false;
      }
    }

    return true;
  });

  const totalVendas = vendasFiltradas.reduce((acc, v) => acc + v.valor, 0);
  const totalAprovadas = vendasFiltradas.filter(v => v.status === 'APROVADO').length;
  const totalPendentes = vendasFiltradas.filter(v => v.status === 'PENDENTE').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Carregando...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">💳 Vendas</h1>
              <p className="text-sm text-gray-500">Gerencie todas as suas vendas</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium opacity-90">Total em Vendas</div>
                <DollarSign size={24} />
              </div>
              <div className="text-3xl font-bold">R$ {totalVendas.toFixed(2).replace('.', ',')}</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Total de Vendas</div>
                <ShoppingBag size={20} className="text-gray-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{vendasFiltradas.length}</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Aprovadas</div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-3xl font-bold text-green-600">{totalAprovadas}</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Pendentes</div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
              <div className="text-3xl font-bold text-yellow-600">{totalPendentes}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Filter size={20} className="text-gray-600" />
              <span className="font-semibold text-gray-900">Filtros</span>
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={() => setFiltroStatus('TODAS')} className={`px-4 py-2 rounded-lg font-semibold transition ${filtroStatus === 'TODAS' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Todas</button>
              <button onClick={() => setFiltroStatus('PENDENTE')} className={`px-4 py-2 rounded-lg font-semibold transition ${filtroStatus === 'PENDENTE' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Pendente</button>
              <button onClick={() => setFiltroStatus('APROVADO')} className={`px-4 py-2 rounded-lg font-semibold transition ${filtroStatus === 'APROVADO' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Aprovada</button>
              <button onClick={() => setFiltroStatus('CANCELADA')} className={`px-4 py-2 rounded-lg font-semibold transition ${filtroStatus === 'CANCELADA' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Cancelada</button>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-600" />
              <button onClick={() => setFiltroData('TODAS')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${filtroData === 'TODAS' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Todas</button>
              <button onClick={() => setFiltroData('HOJE')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${filtroData === 'HOJE' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Hoje</button>
              <button onClick={() => setFiltroData('ONTEM')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${filtroData === 'ONTEM' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Ontem</button>
              <button onClick={() => setFiltroData('7D')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${filtroData === '7D' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>7 dias</button>
              <button onClick={() => setFiltroData('14D')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${filtroData === '14D' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>14 dias</button>
              <button onClick={() => setFiltroData('30D')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${filtroData === '30D' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>30 dias</button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Produto</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Valor Bruto</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Valor Líquido</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        Nenhuma venda encontrada com os filtros selecionados
                      </td>
                    </tr>
                  ) : (
                    vendasFiltradas.map((venda) => (
                      <tr key={venda.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(venda.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-900">{venda.produto.nome}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">{venda.compradorNome}</div>
                          <div className="text-xs text-gray-500">{venda.compradorEmail}</div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          R$ {venda.valor.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-4 px-4 font-semibold text-green-600">
                          {venda.transacoes && venda.transacoes.length > 0 
                            ? `R$ ${venda.transacoes[0].valor.toFixed(2).replace('.', ',')}`
                            : '-'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                            venda.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                            venda.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              venda.status === 'APROVADO' ? 'bg-green-500' :
                              venda.status === 'PENDENTE' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            {venda.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{venda.metodoPagamento}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}