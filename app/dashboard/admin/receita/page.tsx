'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import {
  TrendingUp, DollarSign, ShoppingCart, Award,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle,
  XCircle, CreditCard, BarChart2, ChevronLeft, ChevronRight,
  Calendar, Search
} from 'lucide-react';

interface CurrentUser { nome: string; role?: string; }

interface Transacao {
  id: string;
  valor: number;
  valorLiquido: number;
  taxaValor: number;
  taxaPercentual: number;
  taxaFixo: number;
  status: string;
  metodoPagamento: string;
  compradorNome: string;
  nomePlano: string;
  vendedorNome: string;
  planoTaxaNome: string;
  createdAt: string;
}

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
  vendasPorMetodo: { metodoPagamento: string; _sum: { valor: number | null }; _count: number }[];
  topVendedores: { id: string; nome: string; totalVendas: number; totalVolume: number; totalTaxas: number }[];
  topProdutos: { id: string; nome: string; totalVendas: number; totalVolume: number }[];
  saquesPendentes: { total: number; valor: number };
  saquesAprovados: number;
  totalUsuarios: number;
  usuariosNovosHoje: number;
  grafico30dias: { data: string; valor: number; count: number }[];
  transacoes: Transacao[];
  transacoesPaginacao: { total: number; pagina: number; porPagina: number; totalPaginas: number };
}

function fmt(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAGO: 'bg-green-100 text-green-700',
    PENDENTE: 'bg-yellow-100 text-yellow-700',
    CANCELADO: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function MetodoBadge({ metodo }: { metodo: string }) {
  const map: Record<string, string> = {
    PIX: 'bg-green-50 text-green-600',
    CARTAO: 'bg-blue-50 text-blue-600',
    BOLETO: 'bg-orange-50 text-orange-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${map[metodo] || 'bg-gray-50 text-gray-600'}`}>
      {metodo}
    </span>
  );
}

export default function ReceitaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [data, setData] = useState<ReceitaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTransacoes, setLoadingTransacoes] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroAplicado, setFiltroAplicado] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const carregarDados = useCallback(async (pg: number, inicio: string, fim: string, isTransacaoChange = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (isTransacaoChange) setLoadingTransacoes(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({ pagina: String(pg) });
      if (inicio) params.set('dataInicio', inicio);
      if (fim) params.set('dataFim', fim);

      const res = await fetch(`/api/admin/receita?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingTransacoes(false);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      if (user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    }
    carregarDados(1, '', '');
  }, [router, carregarDados]);

  const aplicarFiltro = () => {
    setPagina(1);
    setFiltroAplicado(!!(dataInicio || dataFim));
    carregarDados(1, dataInicio, dataFim);
  };

  const limparFiltro = () => {
    setDataInicio('');
    setDataFim('');
    setFiltroAplicado(false);
    setPagina(1);
    carregarDados(1, '', '');
  };

  const mudarPagina = (pg: number) => {
    setPagina(pg);
    carregarDados(pg, dataInicio, dataFim, true);
    document.getElementById('transacoes-section')?.scrollIntoView({ behavior: 'smooth' });
  };

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
  const { transacoesPaginacao } = data;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={currentUser} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart2 size={22} className="text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Receita da Plataforma</h1>
                <p className="text-sm text-gray-500">Visão financeira completa da Finora</p>
              </div>
            </div>

            {/* Filtro de data */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <Calendar size={16} className="text-gray-400" />
                <input
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="text-sm bg-transparent outline-none text-gray-700"
                />
                <span className="text-gray-400 text-sm">até</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  className="text-sm bg-transparent outline-none text-gray-700"
                />
              </div>
              <button
                onClick={aplicarFiltro}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition"
              >
                Filtrar
              </button>
              {filtroAplicado && (
                <button
                  onClick={limparFiltro}
                  className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
          {filtroAplicado && (
            <div className="mt-2 text-xs text-purple-600 font-medium">
              📅 Resumo filtrado: {dataInicio} até {dataFim}  •  Transações sempre exibem histórico completo
            </div>
          )}
        </header>

        <div className="p-8 space-y-8">

          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">Finora</span>
              </div>
              <div className="text-2xl font-bold">{fmt(data.receitaLiquida)}</div>
              <div className="text-sm text-purple-200 mt-1">Receita Líquida (Taxas reais)</div>
              <div className="text-xs text-purple-200 mt-2">Este mês: {fmt(data.receitaLiquidaMes)}</div>
            </div>

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

          {/* Gráfico + Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Vendas — Últimos 30 dias</h2>
                <span className="text-sm text-gray-500">{fmt(data.grafico30dias.reduce((a, d) => a + d.valor, 0))}</span>
              </div>
              <div className="flex items-end gap-1 h-32 w-full">
                {data.grafico30dias.map((d, i) => (
                  <div key={i} className="flex-1 group cursor-pointer" title={`${d.data}: ${fmt(d.valor)} (${d.count})`}>
                    <div
                      className="w-full bg-purple-500 rounded-t-sm group-hover:bg-purple-400 transition-colors"
                      style={{ height: `${Math.max((d.valor / maxGrafico) * 100, 2)}%` }}
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

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Status das Vendas</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Pagas</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">{data.vendasPagas.total}</div>
                    <div className="text-xs text-gray-500">{fmt(data.vendasPagas.valor)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-yellow-600" />
                    <span className="text-sm font-medium text-gray-700">Pendentes</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-yellow-600">{data.vendasPendentes.total}</div>
                    <div className="text-xs text-gray-500">{fmt(data.vendasPendentes.valor)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <XCircle size={16} className="text-red-500" />
                    <span className="text-sm font-medium text-gray-700">Canceladas</span>
                  </div>
                  <div className="text-sm font-bold text-red-500">{data.vendasCanceladas}</div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Por Método</p>
                  {data.vendasPorMetodo.map((m, i) => (
                    <div key={i} className="flex items-center justify-between mb-1">
                      <MetodoBadge metodo={m.metodoPagamento} />
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-700">{fmt(m._sum.valor || 0)}</span>
                        <span className="text-xs text-gray-400 ml-1">({m._count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Vendedores + Produtos + Saques */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🏆 Top Vendedores</h2>
              <div className="space-y-3">
                {data.topVendedores.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum dado</p>}
                {data.topVendedores.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-orange-400'}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{v.nome}</div>
                      <div className="text-xs text-gray-400">{v.totalVendas} vendas · taxa: {fmt(v.totalTaxas)}</div>
                    </div>
                    <div className="text-sm font-bold text-purple-600">{fmt(v.totalVolume)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📦 Top Produtos</h2>
              <div className="space-y-3">
                {data.topProdutos.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum dado</p>}
                {data.topProdutos.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-orange-400'}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{p.nome}</div>
                      <div className="text-xs text-gray-400">{p.totalVendas} vendas</div>
                    </div>
                    <div className="text-sm font-bold text-purple-600">{fmt(p.totalVolume)}</div>
                  </div>
                ))}
              </div>
            </div>

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
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Total Vendedores</span><span className="font-bold text-purple-600">{data.totalUsuarios}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Novos Hoje</span><span className={`font-bold ${data.usuariosNovosHoje > 0 ? 'text-green-600' : 'text-gray-400'}`}>{data.usuariosNovosHoje > 0 ? `+${data.usuariosNovosHoje}` : '0'}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Transações */}
          <div id="transacoes-section" className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Todas as Transações</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Histórico completo · {transacoesPaginacao.total} transações</p>
                </div>
                <span className="text-sm text-gray-400">Página {transacoesPaginacao.pagina} de {transacoesPaginacao.totalPaginas}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loadingTransacoes ? (
                <div className="flex items-center justify-center py-16 text-purple-600">Carregando transações...</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vendedor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Método</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Taxa</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Líquido</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.transacoes.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <span className="font-mono text-xs text-gray-400">{t.id.substring(0, 8)}...</span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800 truncate max-w-32">{t.compradorNome}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-700 truncate max-w-32">{t.vendedorNome}</div>
                          <div className="text-xs text-gray-400">{t.planoTaxaNome}</div>
                        </td>
                        <td className="px-4 py-3"><MetodoBadge metodo={t.metodoPagamento} /></td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(t.valor)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-red-500 font-semibold">{fmt(t.taxaValor)}</span>
                          <div className="text-xs text-gray-400">{t.taxaPercentual}% + {fmt(t.taxaFixo)}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">{fmt(t.valorLiquido)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                          <div className="text-gray-400">{new Date(t.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginação */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {((transacoesPaginacao.pagina - 1) * transacoesPaginacao.porPagina) + 1}–{Math.min(transacoesPaginacao.pagina * transacoesPaginacao.porPagina, transacoesPaginacao.total)} de {transacoesPaginacao.total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => mudarPagina(pagina - 1)}
                  disabled={pagina <= 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, transacoesPaginacao.totalPaginas) }, (_, i) => {
                  const start = Math.max(1, pagina - 2);
                  const pg = start + i;
                  if (pg > transacoesPaginacao.totalPaginas) return null;
                  return (
                    <button
                      key={pg}
                      onClick={() => mudarPagina(pg)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${pg === pagina ? 'bg-purple-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => mudarPagina(pagina + 1)}
                  disabled={pagina >= transacoesPaginacao.totalPaginas}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}