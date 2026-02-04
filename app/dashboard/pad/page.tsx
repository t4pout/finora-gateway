'use client';

import Image from 'next/image';

import DashboardSidebar from '../components/Sidebar';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Package, CheckCircle, XCircle, Eye, 
  MessageCircle, MoreVertical, CreditCard, LogOut, Home,
  DollarSign, Users, ShoppingBag, Wallet, BarChart3, Shield,
  Calendar, ChevronDown
} from 'lucide-react';

interface PedidoPAD {
  id: string;
  hash: string;
  clienteNome: string;
  clienteCpfCnpj: string;
  clienteTelefone: string;
  clienteEmail: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  produtoNome: string;
  produtoImagem: string;
  valor: number;
  quantidade: number;
  status: 'EM_ANALISE' | 'APROVADO' | 'CANCELADO';
  motivo: string;
  createdAt: string;
  vendaId: string;
  codigoRastreio: string;
}

interface Stats {
  total: { count: number; valor: number };
  emAnalise: { count: number; valor: number };
  aprovados: { count: number; valor: number };
  enviados: { count: number; valor: number };
  entregue: { count: number; valor: number };
  pagos: { count: number; valor: number };
  cancelados: { count: number; valor: number };
}

export default function DashboardPADPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<PedidoPAD[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [busca, setBusca] = useState('');
  const [user, setUser] = useState<any>(null);
  const [modalDetalhes, setModalDetalhes] = useState<{aberto: boolean; pedido: PedidoPAD | null}>({
    aberto: false,
    pedido: null
  });
  const [modoEdicao, setModoEdicao] = useState(false);
  const [pedidoEditado, setPedidoEditado] = useState<PedidoPAD | null>(null);
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total: { count: 0, valor: 0 },
    emAnalise: { count: 0, valor: 0 },
    aprovados: { count: 0, valor: 0 },
    enviados: { count: 0, valor: 0 },
    entregue: { count: 0, valor: 0 },
    pagos: { count: 0, valor: 0 },
    cancelados: { count: 0, valor: 0 }
  });

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
  }, []);

  useEffect(() => {
    if (dataInicio && dataFim) {
      carregarPedidos();
    }
  }, [dataInicio, dataFim]);

  const carregarPedidos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pad/listar?dataInicio=${dataInicio}&dataFim=${dataFim}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const pedidosData = data.pedidos || [];
        setPedidos(pedidosData);
        
        // Calcular estatísticas
        const statsCalculadas: Stats = {
          total: {
            count: pedidosData.length,
            valor: pedidosData.reduce((sum: number, p: PedidoPAD) => sum + p.valor, 0)
          },
          emAnalise: {
            count: pedidosData.filter((p: PedidoPAD) => p.status === 'EM_ANALISE').length,
            valor: pedidosData.filter((p: PedidoPAD) => p.status === 'EM_ANALISE').reduce((sum: number, p: PedidoPAD) => sum + p.valor, 0)
          },
          aprovados: {
            count: pedidosData.filter((p: PedidoPAD) => ['AGUARDANDO_ENVIO', 'ENTREGUE'].includes(p.status)).length,
            valor: pedidosData.filter((p: PedidoPAD) => ['AGUARDANDO_ENVIO', 'ENTREGUE'].includes(p.status)).reduce((sum: number, p: PedidoPAD) => sum + p.valor, 0)
          },
          enviados: {
            count: pedidosData.filter((p: PedidoPAD) => ['AGUARDANDO_ENVIO', 'ENTREGUE'].includes(p.status)).length,
            valor: pedidosData.filter((p: PedidoPAD) => ['AGUARDANDO_ENVIO', 'ENTREGUE'].includes(p.status)).reduce((sum: number, p: PedidoPAD) => sum + p.valor, 0)
          },
          entregue: {
            count: pedidosData.filter((p: PedidoPAD) => p.status === 'ENTREGUE').length,
            valor: pedidosData.filter((p: PedidoPAD) => p.status === 'ENTREGUE').reduce((sum: number, p: PedidoPAD) => sum + p.valor, 0)
          },
          pagos: {
            count: pedidosData.filter((p: PedidoPAD) => p.status === 'PAGO').length,
            valor: pedidosData.filter((p: PedidoPAD) => p.status === 'PAGO').reduce((sum: number, p: PedidoPAD) => sum + p.valor, 0)
          },
          cancelados: {
            count: pedidosData.filter((p: PedidoPAD) => p.status === 'CANCELADO').length,
            valor: pedidosData.filter((p: PedidoPAD) => p.status === 'CANCELADO').reduce((sum: number, p: PedidoPAD) => sum + p.valor, 0)
          }
        };
        
        setStats(statsCalculadas);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
    setLoading(false);
  };

  const aprovarPedido = async (hash: string) => {
    if (!confirm('Aprovar este pedido?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/pad/aprovar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hash })
      });
      alert('✅ Pedido aprovado!');
      carregarPedidos();
    } catch (error) {
      alert('❌ Erro ao aprovar');
    }
  };

  const cancelarPedido = async (hash: string) => {
    if (!confirm('Cancelar este pedido?')) return;
    const motivo = 'Cancelado pelo vendedor';

    try {
      const token = localStorage.getItem('token');
      await fetch('/api/pad/cancelar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hash, motivo })
      });
      alert('✅ Pedido cancelado!');
      carregarPedidos();
    } catch (error) {
      alert('❌ Erro ao cancelar');
    }
  };

  
  const marcarComoEnviado = async (hash: string) => {
    if (!confirm('Marcar pedido como enviado?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/pad/marcar-envio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hash })
      });
      alert('✅ Status atualizado!');
      carregarPedidos();
    } catch (error) {
      alert('❌ Erro ao atualizar');
    }
  };

  const marcarAguardandoPagamento = async (hash: string) => {
    if (!confirm('Marcar como aguardando pagamento?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/pad/marcar-pagamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hash })
      });
      alert('✅ Status atualizado!');
      carregarPedidos();
    } catch (error) {
      alert('❌ Erro ao atualizar');
    }
  };
  
  const marcarComoEntregue = async (hash: string) => {
    if (!confirm('Marcar pedido como entregue?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/pad/marcar-entregue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hash })
      });
      alert('✅ Pedido marcado como entregue!');
      carregarPedidos();
    } catch (error) {
      alert('❌ Erro ao atualizar');
    }
  };
  const abrirWhatsApp = (telefone: string, nome: string, produto: string, valor: number) => {
    const tel = telefone.replace(/\D/g, '');
    const mensagem = `Olá ${nome}! Sobre seu pedido de ${produto} no valor de R$ ${valor.toFixed(2)}...`;
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const copiarLinkPagamento = (hash: string) => {
    const link = `${window.location.origin}/pad/pagar/${hash}`;
    navigator.clipboard.writeText(link);
    alert('✅ Link copiado!');
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

  const pedidosFiltrados = pedidos.filter(p => {
    const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus;
    const matchBusca = !busca || 
      p.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
      p.clienteCpfCnpj.includes(busca) ||
      p.hash.includes(busca);
    return matchStatus && matchBusca;
  });
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl"></div>
            <div>
              <Image 
            src="/logo.png" 
            alt="Finora" 
            width={160} 
            height={45}
            priority
          />
            </div>
          </div>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-lg">{user?.nome?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{user?.nome}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition">
              <Home size={20} />
              <span>Página Inicial</span>
            </div>
          </Link>
          <Link href="/dashboard/produtos">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition">
              <Package size={20} />
              <span>Produtos</span>
            </div>
          </Link>
          <Link href="/dashboard/vendas">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition">
              <DollarSign size={20} />
              <span>Vendas</span>
            </div>
          </Link>
          <Link href="/dashboard/pad">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-purple-50 text-purple-600 font-semibold">
              <Package size={20} />
              <span>Pedidos PAD</span>
            </div>
          </Link>
          <Link href="/dashboard/carteira">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition">
              <Wallet size={20} />
              <span>Carteira</span>
            </div>
          </Link>
          <div className="border-t border-gray-200 my-4"></div>
          <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 font-medium transition">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </nav>

        {user?.role === 'ADMIN' && (
          <div className="p-4 border-t border-gray-200">
            <Link href="/dashboard/admin">
              <div className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition">
                <Shield size={20} />
                <span>Administrativo</span>
              </div>
            </Link>
          </div>
        )}

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">© 2026 Finora</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📦 Pedidos PAD</h1>
              <p className="text-gray-600">Pagamento Após Entrega</p>
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

        <div className="p-8">
          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                R$ {stats.total.valor.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-xs text-gray-500 mt-1">Pedidos gerados: {stats.total.count}</div>
            </div>
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
              <div className="text-2xl font-bold text-yellow-900 mb-1">
                R$ {stats.emAnalise.valor.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-yellow-600">Em Análise</div>
              <div className="text-xs text-yellow-700 mt-1">Pedidos em análise: {stats.emAnalise.count}</div>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <div className="text-2xl font-bold text-green-900 mb-1">
                R$ {stats.aprovados.valor.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-green-600">Aprovados</div>
              <div className="text-xs text-green-700 mt-1">PAD aprovadas: {stats.aprovados.count}</div>
            </div>
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="text-2xl font-bold text-blue-900 mb-1">
                R$ {stats.enviados.valor.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-blue-600">Enviados</div>
              <div className="text-xs text-blue-700 mt-1">Pedidos enviados: {stats.enviados.count}</div>
            </div>            <div className="bg-teal-50 rounded-xl border border-teal-200 p-4">
              <div className="text-2xl font-bold text-teal-900 mb-1">
                R$ {stats.entregue.valor.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-teal-600">Entregue</div>
              <div className="text-xs text-teal-700 mt-1">Pedidos entregues: {stats.entregue.count}</div>
            </div>

            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
              <div className="text-2xl font-bold text-purple-900 mb-1">
                R$ {stats.pagos.valor.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-purple-600">Pagos</div>
              <div className="text-xs text-purple-700 mt-1">Pedidos pagos: {stats.pagos.count}</div>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <div className="text-2xl font-bold text-red-900 mb-1">
                R$ {stats.cancelados.valor.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-red-600">Cancelados</div>
              <div className="text-xs text-red-700 mt-1">Pedidos cancelados: {stats.cancelados.count}</div>
            </div>
          </div>
          {/* FILTROS */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="🔍 Buscar por nome, CPF ou hash..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="EM_ANALISE">Em Análise</option>
                <option value="APROVADO">Aprovados</option>
                <option value="CANCELADO">Cancelados</option>
              </select>
            </div>
          </div>

          {/* TABELA */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hash</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pedidosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Package size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-600">Nenhum pedido encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    pedidosFiltrados.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{pedido.hash}</code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{pedido.clienteNome}</div>
                          <div className="text-xs text-gray-500">{pedido.clienteCpfCnpj}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {pedido.produtoImagem && (
                              <img src={pedido.produtoImagem} alt="" className="w-8 h-8 rounded object-cover" />
                            )}
                            <span className="text-sm">{pedido.produtoNome}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">R$ {pedido.valor.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            pedido.status === 'EM_ANALISE' ? 'bg-yellow-100 text-yellow-700' :
                            pedido.status === 'AGUARDANDO_ENVIO' ? 'bg-blue-100 text-blue-700' :
                            pedido.status === 'ENTREGUE' ? 'bg-teal-100 text-teal-700' :
                            pedido.status === 'PAGO' ? 'bg-purple-100 text-purple-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {pedido.status === 'EM_ANALISE' ? 'Em análise' :
                             pedido.status === 'AGUARDANDO_ENVIO' ? 'PAD Aprovado - Enviado' :
                             pedido.status === 'ENTREGUE' ? 'PAD Aprovado - Entregue' :
                             pedido.status === 'PAGO' ? 'Pago' :
                             'Cancelado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setModalDetalhes({ aberto: true, pedido })}
                              className="p-2 hover:bg-gray-100 rounded-lg transition"
                              title="Ver detalhes"
                            >
                              <Eye size={18} className="text-gray-600" />
                            </button>

                            <button
                              onClick={() => abrirWhatsApp(pedido.clienteTelefone, pedido.clienteNome, pedido.produtoNome, pedido.valor)}
                              className="p-2 hover:bg-green-50 rounded-lg transition"
                              title="WhatsApp"
                            >
                              <MessageCircle size={18} className="text-green-600" />
                            </button>

                            <div className="relative">
                              <button
                                onClick={() => setMenuAberto(menuAberto === pedido.id ? null : pedido.id)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                              >
                                <MoreVertical size={18} className="text-gray-600" />
                              </button>

                              {menuAberto === pedido.id && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                                  <button
                                    onClick={() => {
                                      copiarLinkPagamento(pedido.hash);
                                      setMenuAberto(null);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 border-b"
                                  >
                                    <CreditCard size={16} />
                                    <span className="text-sm">Acessar Link de Pagamento</span>
                                  </button>                                  
                                  {pedido.status === 'AGUARDANDO_ENVIO' && (
                                    <button
                                      onClick={() => {
                                        marcarComoEntregue(pedido.hash);
                                        setMenuAberto(null);
                                      }}
                                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 text-teal-600 border-b"
                                    >
                                      <CheckCircle size={16} />
                                      <span className="text-sm">Marcar como Entregue</span>
                                    </button>
                                  )}               
                                  {pedido.status === 'APROVADO' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          marcarComoEnviado(pedido.hash);
                                          setMenuAberto(null);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 text-blue-600 border-b"
                                      >
                                        <Package size={16} />
                                        <span className="text-sm">Marcar como Enviado</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          marcarAguardandoPagamento(pedido.hash);
                                          setMenuAberto(null);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 text-purple-600 border-b"
                                      >
                                        <CreditCard size={16} />
                                        <span className="text-sm">Aguardando Pagamento</span>
                                      </button>
                                    </>
                                  )}


                                  
                                  {pedido.status === 'EM_ANALISE' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          aprovarPedido(pedido.hash);
                                          setMenuAberto(null);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 text-green-600 border-b"
                                      >
                                        <CheckCircle size={16} />
                                        <span className="text-sm">Aprovar</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          cancelarPedido(pedido.hash);
                                          setMenuAberto(null);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                                      >
                                        <XCircle size={16} />
                                        <span className="text-sm">Cancelar</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      {/* MODAL DETALHES */}
      {modalDetalhes.aberto && modalDetalhes.pedido && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setModalDetalhes({ aberto: false, pedido: null })}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-gray-900">📦 Detalhes da Transação PAD</h3>
                  <button
                    onClick={() => {
                      setModoEdicao(!modoEdicao);
                      if (!modoEdicao) {
                        setPedidoEditado(JSON.parse(JSON.stringify(modalDetalhes.pedido)));
                      }
                    }}
                    className="p-2 hover:bg-purple-50 rounded-lg transition"
                    title={modoEdicao ? "Cancelar edição" : "Editar pedido"}
                  >
                    {modoEdicao ? (
                      <span className="text-red-600">✕</span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    )}
                  </button>
                </div>
              <button 
                onClick={() => setModalDetalhes({ aberto: false, pedido: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4">Informações da Transação</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Hash:</div>
                      <div className="font-mono text-sm">{modalDetalhes.pedido.hash}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Valor:</div>
                      <div className="text-lg font-bold text-purple-600">R$ {modalDetalhes.pedido.valor.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Status:</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        modalDetalhes.pedido.status === 'EM_ANALISE' ? 'bg-yellow-100 text-yellow-700' :
                        modalDetalhes.pedido.status === 'AGUARDANDO_ENVIO' ? 'bg-blue-100 text-blue-700' :
                        modalDetalhes.pedido.status === 'ENTREGUE' ? 'bg-teal-100 text-teal-700' :
                        modalDetalhes.pedido.status === 'PAGO' ? 'bg-purple-100 text-purple-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {modalDetalhes.pedido.status === 'EM_ANALISE' ? 'Em Análise' :
                         modalDetalhes.pedido.status === 'AGUARDANDO_ENVIO' ? 'PAD Aprovado - Enviado' :
                         modalDetalhes.pedido.status === 'ENTREGUE' ? 'PAD Aprovado - Entregue' :
                         modalDetalhes.pedido.status === 'PAGO' ? 'Pago' :
                         'Cancelado'}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Data de Criação:</div>
                      <div className="text-sm">{new Date(modalDetalhes.pedido.createdAt).toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4">Informações do Cliente</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Nome:</div>
                      {modoEdicao ? (
                        <input
                          type="text"
                          value={pedidoEditado?.clienteNome || ''}
                          onChange={(e) => setPedidoEditado(prev => prev ? {...prev, clienteNome: e.target.value} : null)}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                        />
                      ) : (
                        <div className="font-medium">{modalDetalhes.pedido.clienteNome}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Email:</div>
                      {modoEdicao ? (
                        <input
                          type="email"
                          value={pedidoEditado?.clienteEmail || ''}
                          onChange={(e) => setPedidoEditado(prev => prev ? {...prev, clienteEmail: e.target.value} : null)}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                        />
                      ) : (
                        <div className="text-sm">{modalDetalhes.pedido.clienteEmail || 'Não informado'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Telefone:</div>
                      {modoEdicao ? (
                        <input
                          type="text"
                          value={pedidoEditado?.clienteTelefone || ''}
                          onChange={(e) => setPedidoEditado(prev => prev ? {...prev, clienteTelefone: e.target.value} : null)}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                        />
                      ) : (
                        <div className="text-sm">{modalDetalhes.pedido.clienteTelefone}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Documento:</div>
                      {modoEdicao ? (
                        <input
                          type="text"
                          value={pedidoEditado?.clienteCpfCnpj || ''}
                          onChange={(e) => setPedidoEditado(prev => prev ? {...prev, clienteCpfCnpj: e.target.value} : null)}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                        />
                      ) : (
                        <div className="text-sm">{modalDetalhes.pedido.clienteCpfCnpj}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4">Endereço de Entrega</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Endereço:</span>{' '}
                      {modalDetalhes.pedido.rua}, {modalDetalhes.pedido.numero}
                      {modalDetalhes.pedido.complemento && ` - ${modalDetalhes.pedido.complemento}`}
                    </div>
                    <div>
                      <span className="text-gray-600">Bairro:</span> {modalDetalhes.pedido.bairro}
                    </div>
                    <div>
                      <span className="text-gray-600">Cidade/Estado:</span>{' '}
                      {modalDetalhes.pedido.cidade} - {modalDetalhes.pedido.estado}
                    </div>
                    <div>
                      <span className="text-gray-600">CEP:</span> {modalDetalhes.pedido.cep}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4">Informações do Produto</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Produto:</div>
                      <div className="font-medium">{modalDetalhes.pedido.produtoNome}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Preço:</div>
                      <div className="text-lg font-bold text-purple-600">R$ {modalDetalhes.pedido.valor.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => abrirWhatsApp(
                      modalDetalhes.pedido!.clienteTelefone,
                      modalDetalhes.pedido!.clienteNome,
                      modalDetalhes.pedido!.produtoNome,
                      modalDetalhes.pedido!.valor
                    )}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center space-x-2"
                  >
                    <MessageCircle size={20} />
                    <span>WhatsApp</span>
                  </button>

                  {modalDetalhes.pedido.status === 'EM_ANALISE' && (
                    <>
                      <button
                        onClick={() => {
                          aprovarPedido(modalDetalhes.pedido!.hash);
                          setModalDetalhes({ aberto: false, pedido: null });
                        }}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                      >
                        APROVAR
                      </button>
                      <button
                        onClick={() => {
                          cancelarPedido(modalDetalhes.pedido!.hash);
                          setModalDetalhes({ aberto: false, pedido: null });
                        }}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                      >
                        REPROVAR
                      </button>
                    </>
                  )}
                </div>
              </div>

              {modoEdicao && (
                  <div className="mt-4">
                    <button
                      onClick={salvarEdicao}
                      className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                    >
                      💾 SALVAR ALTERAÇÕES
                    </button>
                  </div>
                )}

                {!modoEdicao && modalDetalhes.pedido.status !== 'CANCELADO' && (
                  <div className="mt-4">
                    <button
                      onClick={() => reprovarPedido(modalDetalhes.pedido!.hash)}
                      className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                    >
                      🚫 REPROVAR/CANCELAR PEDIDO
                    </button>
                  </div>
                )}

                <div className="mt-4">
                <button
                  onClick={() => setModalDetalhes({ aberto: false, pedido: null })}
                  className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  FECHAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}