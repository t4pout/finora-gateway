'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, CheckCircle, XCircle, Clock, Truck, Search, Filter, Calendar } from 'lucide-react';

export default function DashboardPADPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [busca, setBusca] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [user, setUser] = useState<any>(null);

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    emAnalise: 0,
    aprovados: 0,
    enviados: 0,
    pagos: 0,
    cancelados: 0,
    valorTotal: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pad/listar', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPedidos(data.pedidos || []);
        calcularStats(data.pedidos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularStats = (pedidosData: any[]) => {
    const stats = {
      total: pedidosData.length,
      emAnalise: pedidosData.filter(p => p.status === 'EM_ANALISE').length,
      aprovados: pedidosData.filter(p => p.status === 'APROVADO').length,
      enviados: pedidosData.filter(p => p.status === 'ENVIADO').length,
      pagos: pedidosData.filter(p => p.status === 'PAGO').length,
      cancelados: pedidosData.filter(p => p.status === 'CANCELADO').length,
      valorTotal: pedidosData
        .filter(p => p.status === 'PAGO')
        .reduce((acc, p) => acc + p.valor, 0)
    };
    setStats(stats);
  };

  const aprovarPedido = async (id: string) => {
    if (!confirm('Deseja aprovar este pedido?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pad/${id}/aprovar`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('✅ Pedido aprovado!');
        carregarPedidos();
      } else {
        alert('❌ Erro ao aprovar pedido');
      }
    } catch (error) {
      alert('❌ Erro ao conectar');
    }
  };

  const cancelarPedido = async (id: string) => {
    const motivo = prompt('Motivo do cancelamento:');
    if (!motivo) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pad/${id}/cancelar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ motivo })
      });

      if (response.ok) {
        alert('✅ Pedido cancelado!');
        carregarPedidos();
      } else {
        alert('❌ Erro ao cancelar pedido');
      }
    } catch (error) {
      alert('❌ Erro ao conectar');
    }
  };

  const pedidosFiltrados = pedidos
    .filter(p => filtroStatus === 'TODOS' || p.status === filtroStatus)
    .filter(p => {
      if (!busca) return true;
      const searchLower = busca.toLowerCase();
      return (
        p.clienteNome.toLowerCase().includes(searchLower) ||
        p.clienteCpfCnpj.includes(busca) ||
        p.hash.toLowerCase().includes(searchLower)
      );
    })
    .filter(p => {
      if (!dataSelecionada) return true;
      const pedidoData = new Date(p.createdAt).toISOString().split('T')[0];
      return pedidoData === dataSelecionada;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_ANALISE': return 'bg-yellow-100 text-yellow-800';
      case 'APROVADO': return 'bg-green-100 text-green-800';
      case 'ENVIADO': return 'bg-blue-100 text-blue-800';
      case 'PAGO': return 'bg-purple-100 text-purple-800';
      case 'CANCELADO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EM_ANALISE': return 'Em análise';
      case 'APROVADO': return 'Aprovado';
      case 'ENVIADO': return 'Enviado';
      case 'PAGO': return 'Pago';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-purple-600 text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft size={20} />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">📦 Pedidos PAD</h1>
                <p className="text-sm text-gray-600">Pay After Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">Em Análise</span>
            </div>
            <div className="text-2xl font-bold text-yellow-900">{stats.emAnalise}</div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">Aprovados</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{stats.aprovados}</div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-800">Enviados</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{stats.enviados}</div>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 shadow-sm border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-800">Pagos</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{stats.pagos}</div>
          </div>

          <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-200">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-800">Cancelados</span>
            </div>
            <div className="text-2xl font-bold text-red-900">{stats.cancelados}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF ou hash..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="TODOS">Todos os status</option>
                <option value="EM_ANALISE">Em análise</option>
                <option value="APROVADO">Aprovado</option>
                <option value="ENVIADO">Enviado</option>
                <option value="PAGO">Pago</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Pedidos */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Hash</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Cliente</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Produto</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Valor</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Data</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((pedido) => (
                    <tr key={pedido.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm text-gray-900">{pedido.hash}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{pedido.clienteNome}</div>
                        <div className="text-sm text-gray-500">{pedido.clienteCpfCnpj}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">{pedido.produtoNome}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">
                          R$ {pedido.valor.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(pedido.status)}`}>
                          {getStatusLabel(pedido.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          {pedido.status === 'EM_ANALISE' && (
                            <>
                              <button
                                onClick={() => aprovarPedido(pedido.id)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => cancelarPedido(pedido.id)}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}