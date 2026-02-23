'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Users, Award, ArrowUpRight, ArrowDownRight, Clock,
  CheckCircle, XCircle, CreditCard, BarChart2, Wallet
} from 'lucide-react';

interface CurrentUser { nome: string; role?: string; }

interface ReceitaData {
  receitaBruta: number;
  receitaLiquida: number;
  receitaBrutaMes: number;
  receitaLiquidaMes: number;
  variacaoMes: number;
  ticketMedio: number;
  taxaConversao: number;
  vendasPagas: { total: number; valor: number };
  vendasPendentes: { total: number; valor: number };
  vendasCanceladas: number;
  totalVendas: number;
  vendasPorMetodo: { metodoPagamento: string; _sum: { valor: number }; _count: number }[];
  topVendedores: { id: string; nome: string; email: string; totalVendas: number; totalVolume: number }[];
  topProdutos: { id: string; nome: string; totalVendas: number; totalVolume: number }[];
  saquesPendentes: { total: number; valor: number };
  saquesAprovados: number;
  totalUsuarios: number;
  usuariosNovosHoje: number;
  grafico30dias: { data: string; valor: number; count: number }[];
}

function fmt(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function MiniGrafico({ dados }: { dados: { data: string; valor: number }[] }) {
  const max = Math.max(...dados.map(d => d.valor), 1);
  return (
    <div className="flex items-end gap-0.5 h-12 w-full">
      {dados.map((d, i) => (
        <div
          key={i}
          className="flex-1 bg-purple-400 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
          style={{ height: `${Math.max((d.valor / max) * 100, 2)}%` }}
          title={`${d.data}: ${fmt(d.valor)}`}
        />
      ))}
    </div>
  );
}

function MetodoIcon({ metodo }: { metodo: string }) {
  if (metodo === 'PIX') return <span className="text-green-500 font-bold text-xs">PIX</span>;
  if (metodo === 'CARTAO') return <CreditCard size={14} className="text-blue-500" />;
  if (metodo === 'BOLETO') return <span className="text-orange-500 font-bold text-xs">BOL</span>;
  return <span className="text-gray-500 text-xs">{metodo}</span>;
}

export default function ReceitaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [data, setData] = useState<ReceitaData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      if (user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    }
    fetch('/api/admin/receita', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={currentUser} onLogout={handleLogout} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Carregando...</div>
      </div>
    </div>
  );

  if (!data) return null;

  const variacaoPositiva = data.variacaoMes >= 0;
  const maxGrafico = Math.max(...data.grafico30dias.map(d => d.valor), 1);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={currentUser} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart2 size={22} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Receita da Plataforma</h1>
              <p className="text-sm text-gray-500">Visão geral financeira da Finora</p>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">

          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Receita Bruta */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${variacaoPositiva ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {variacaoPositiva ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(data.variacaoMes).toFixed(1)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{fmt(data.receitaBruta)}</div>
              <div className="text-sm text-gray-500 mt-1">Receita Bruta Total</div>
              <div className="text-xs text-purple-600 mt-2 font-medium">Este mês: {fmt(data.receitaBrutaMes)}</div>
            </div>

            {/* Receita Líquida */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">Finora</span>
              </div>
              <div className="text-2xl font-bold">{fmt(data.receitaLiquida)}</div>
              <div className="text-sm text-purple-200 mt-1">Receita Líquida (Taxas)</div>
              <div className="text-xs text-purple-200 mt-2">Este mês: {fmt(data.receitaLiquidaMes)}</div>
            </div>

            {/* Ticket Médio */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={20} className="text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{fmt(data.ticketMedio)}</div>
              <div className="text-sm text-gray-500 mt-1">Ticket Médio</div>
              <div className="text-xs text-blue-600 mt-2 font-medium">{data.vendasPagas.total} vendas pagas</div>
            </div>

            {/* Taxa de Conversão */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Award size={20} className="text-orange-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{data.taxaConversao.toFixed(1)}%</div>
              <div className="text-sm text-gray-500 mt-1">Taxa de Conversão</div>
              <div className="text-xs text-orange-600 mt-2 font-medium">{data.totalVendas} vendas geradas</div>
            </div>
          </div>

          {/* Gráfico + Status vendas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Gráfico 30 dias */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Vendas — Últimos 30 dias</h2>
                <span className="text-sm text-gray-500">{fmt(data.grafico30dias.reduce((a, d) => a + d.valor, 0))}</span>
              </div>
              <div className="flex items-end gap-1 h-32 w-full">
                {data.grafico30dias.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full bg-purple-500 rounded-t-sm group-hover:bg-purple-400 transition-colors cursor-pointer"
                      style={{ height: `${Math.max((d.valor / maxGrafico) * 100, 2)}%` }}
                      title={`${d.data}: ${fmt(d.valor)} (${d.count} vendas)`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{data.grafico30dias[0]?.data.slice(5)}</span>
                <span>{data.grafico30dias[14]?.data.slice(5)}</span>
                <span>{data.grafico30dias[29]?.data.slice(5)}</span>
              </div>
            </div>

            {/* Status das vendas */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Status das Vendas</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Pagas</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">{data.vendasPagas.total}</div>
                    <div className="text-xs text-gray-500">{fmt(data.vendasPagas.valor)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-yellow-600" />
                    <span className="text-sm font-medium text-gray-700">Pendentes</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-yellow-600">{data.vendasPendentes.total}</div>
                    <div className="text-xs text-gray-500">{fmt(data.vendasPendentes.valor)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <XCircle size={18} className="text-red-500" />
                    <span className="text-sm font-medium text-gray-700">Canceladas</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-500">{data.vendasCanceladas}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Por Método</h3>
                  <div className="space-y-2">
                    {data.vendasPorMetodo.map((m, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MetodoIcon metodo={m.metodoPagamento} />
                          <span className="text-xs text-gray-600">{m.metodoPagamento}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-700">{fmt(m._sum.valor || 0)}</div>
                          <div className="text-xs text-gray-400">{m._count} vendas</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Vendedores + Top Produtos + Saques */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Top Vendedores */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🏆 Top Vendedores</h2>
              <div className="space-y-3">
                {data.topVendedores.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum dado</p>
                )}
                {data.topVendedores.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-400'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{v.nome}</div>
                      <div className="text-xs text-gray-400">{v.totalVendas} vendas</div>
                    </div>
                    <div className="text-sm font-bold text-purple-600">{fmt(v.totalVolume)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Produtos */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📦 Top Produtos</h2>
              <div className="space-y-3">
                {data.topProdutos.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum dado</p>
                )}
                {data.topProdutos.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-400'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{p.nome}</div>
                      <div className="text-xs text-gray-400">{p.totalVendas} vendas</div>
                    </div>
                    <div className="text-sm font-bold text-purple-600">{fmt(p.totalVolume)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saques + Usuários */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">💸 Saques</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl">
                    <div>
                      <div className="text-xs text-gray-500">Pendentes</div>
                      <div className="text-sm font-bold text-yellow-600">{data.saquesPendentes.total} saques</div>
                    </div>
                    <div className="text-sm font-bold text-yellow-600">{fmt(data.saquesPendentes.valor)}</div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                    <div>
                      <div className="text-xs text-gray-500">Total Pago</div>
                      <div className="text-sm font-bold text-green-600">Histórico</div>
                    </div>
                    <div className="text-sm font-bold text-green-600">{fmt(data.saquesAprovados)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">👥 Usuários</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Vendedores</span>
                    <span className="text-lg font-bold text-purple-600">{data.totalUsuarios}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Novos Hoje</span>
                    <span className={`text-lg font-bold ${data.usuariosNovosHoje > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {data.usuariosNovosHoje > 0 ? `+${data.usuariosNovosHoje}` : '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}