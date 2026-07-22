'use client';

import Sidebar from '@/app/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, ShoppingBag, BarChart3, Filter, Calendar, Eye, X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { agoraBrasil, toBrasil, formatarData, formatarHora, formatarDataHora, inicioDiaBrasil, fimDiaBrasil, inicioDiasAtras, isOntem, parseDateInput } from '@/lib/date-brasil';
import LoadingScreen from '@/app/components/LoadingScreen';

interface Venda {
  id: string;
  valor: number;
  status: string;
  metodoPagamento: string;
  compradorNome: string;
  compradorEmail: string;
  compradorCpf?: string;
  compradorTel?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pixQrCode?: string;
  pixCopiaECola?: string;
  boletoUrl?: string;
  orderBumpsNomes?: string[];
  orderBumpsValor?: number;
  freteNome?: string;
  freteValor?: number;
  quantidade?: number;
  createdAt: string;
  nomePlano?: string;
  produto: { nome: string };
  vendedor?: { nome: string };
  transacoes?: { valor: number }[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface Produto {
  id: string;
  nome: string;
}

interface User {
  nome: string;
  role?: string;
}

const ITENS_POR_PAGINA = 25;

function normStr(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function VendasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('TODAS');
  const [dropdownStatus, setDropdownStatus] = useState(false);
  const [dropdownMetodo, setDropdownMetodo] = useState(false);
  const [dropdownPeriodo, setDropdownPeriodo] = useState(false);
  const [dropdownProduto, setDropdownProduto] = useState(false);
  const [filtroData, setFiltroData] = useState('HOJE');
  const [filtroProduto, setFiltroProduto] = useState('TODOS');
  const [filtroMetodo, setFiltroMetodo] = useState('TODOS');
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mostrandoTodas, setMostrandoTodas] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [busca, setBusca] = useState('');
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) setUser(JSON.parse(userData));
    carregarVendas();
    carregarProdutos();
  }, [router]);

  const carregarVendas = async (mostrarTodas: boolean = false) => {
    try {
      const token = localStorage.getItem('token');
      const url = mostrarTodas ? '/api/vendas?todas=true&limit=9999' : '/api/vendas?limit=9999';
      const response = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
      if (response.ok) {
        const data = await response.json();
        setVendas(data.vendas || []);
        setIsAdmin(data.isAdmin || false);
        setMostrandoTodas(data.mostrandoTodas || false);
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarProdutos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/produtos', { headers: { 'Authorization': 'Bearer ' + token } });
      if (response.ok) {
        const data = await response.json();
        setProdutos(data.produtos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const abrirDetalhes = (venda: Venda) => { setVendaSelecionada(venda); setModalAberto(true); };

  const cancelarVenda = async (vendaId: string) => {
    const motivo = prompt('Motivo do cancelamento (opcional):');
    if (motivo === null) return;
    if (!confirm('Tem certeza que deseja cancelar esta venda? Esta ação não pode ser desfeita.')) return;
    setCancelando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/vendas/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ vendaId, motivo })
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Venda cancelada com sucesso!');
        fecharModal();
        carregarVendas(mostrandoTodas);
      } else {
        alert('❌ Erro: ' + data.error);
      }
    } catch (e) {
      alert('❌ Erro ao cancelar venda');
    } finally {
      setCancelando(false);
    }
  };
  const fecharModal = () => { setModalAberto(false); setVendaSelecionada(null); };

  const mudarFiltro = (fn: () => void) => { fn(); setPaginaAtual(1); };

  const vendasFiltradas = vendas.filter(v => {
    if (filtroStatus !== 'TODAS' && v.status !== filtroStatus) return false;
    if (filtroMetodo !== 'TODOS' && v.metodoPagamento !== filtroMetodo) return false;

    const buscaTrim = busca.trim();
    if (buscaTrim) {
      const buscaNorm = normStr(buscaTrim);
      const nomeNorm = normStr(v.compradorNome ?? '');
      const cpfNorm = (v.compradorCpf ?? '').replace(/\D/g, '');
      const buscaCpf = buscaTrim.replace(/\D/g, '');
      const idNorm = (v.id ?? '').toLowerCase();
      if (!nomeNorm.includes(buscaNorm) && !cpfNorm.includes(buscaCpf) && !idNorm.includes(buscaNorm)) return false;
    }

    if (filtroProduto !== 'TODOS' && v.produto.nome !== filtroProduto) return false;

    if (dataInicio || dataFim) {
      const dataVenda = toBrasil(v.createdAt);
      dataVenda.setHours(0, 0, 0, 0);
      if (dataInicio) {
        const inicio = parseDateInput(dataInicio);
        if (dataVenda < inicio) return false;
      }
      if (dataFim) {
        const fim = parseDateInput(dataFim);
        fim.setHours(23, 59, 59, 999);
        if (dataVenda > fim) return false;
      }
    }

    if (filtroData === 'ONTEM') {
      if (!isOntem(v.createdAt)) return false;
    } else if (filtroData === 'HOJE') {
      const dataVenda = toBrasil(v.createdAt);
      dataVenda.setHours(0, 0, 0, 0);
      const hoje = agoraBrasil();
      hoje.setHours(0, 0, 0, 0);
      if (dataVenda.getTime() !== hoje.getTime()) return false;
    } else if (filtroData === '7D') {
      if (toBrasil(v.createdAt) < inicioDiasAtras(7)) return false;
    } else if (filtroData === '14D') {
      if (toBrasil(v.createdAt) < inicioDiasAtras(14)) return false;
    } else if (filtroData === '30D') {
      if (toBrasil(v.createdAt) < inicioDiasAtras(30)) return false;
    }

    return true;
  });

  const totalPaginas = Math.ceil(vendasFiltradas.length / ITENS_POR_PAGINA);
  const indiceInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const vendasPagina = vendasFiltradas.slice(indiceInicio, indiceInicio + ITENS_POR_PAGINA);

  const totalVendas = vendasFiltradas.reduce((acc, v) => acc + v.valor, 0);
  const totalPagas = vendasFiltradas.filter(v => v.status === 'PAGO').length;
  const totalPendentes = vendasFiltradas.filter(v => v.status === 'PENDENTE').length;
  const ticketMedioGeral = vendasFiltradas.length > 0 ? totalVendas / vendasFiltradas.length : 0;
  const vendasPagas = vendasFiltradas.filter(v => v.status === 'PAGO');
  const totalVendasPagas = vendasPagas.reduce((acc, v) => acc + v.valor, 0);
  const ticketMedioPagas = vendasPagas.length > 0 ? totalVendasPagas / vendasPagas.length : 0;

  const exportarParaExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const dadosExportacao = vendasFiltradas.map(venda => ({
        'Data': formatarData(venda.createdAt),
        'Hora': formatarHora(venda.createdAt),
        'Produto': venda.produto.nome,
        'Cliente': venda.compradorNome,
        'Email': venda.compradorEmail,
        'Telefone': venda.compradorTel || '-',
        'CPF': venda.compradorCpf || '-',
        'Valor Bruto': venda.valor.toFixed(2),
        'Valor Liquido': venda.transacoes && venda.transacoes.length > 0 ? venda.transacoes[0].valor.toFixed(2) : '-',
        'Status': venda.status,
        'Pagamento': venda.metodoPagamento,
        'Quantidade': venda.nomePlano ? (venda.nomePlano.match(/^(\d+)/)?.[1] || '-') : '-',
        'Plano': venda.nomePlano || '-',
        'Order Bumps': venda.orderBumpsNomes && venda.orderBumpsNomes.length > 0 ? venda.orderBumpsNomes.join(' | ') : '-',
        'Valor Order Bumps': venda.orderBumpsValor && venda.orderBumpsValor > 0 ? venda.orderBumpsValor.toFixed(2) : '-',
         'Frete': venda.freteNome || '-',
        'Valor Frete': venda.freteValor && venda.freteValor > 0 ? venda.freteValor.toFixed(2) : '-',
        'Quantidade Produto': venda.quantidade || 1,
        'CEP': venda.cep || '-',
        'Endereco': venda.rua ? venda.rua + ', ' + venda.numero : '-',
        'Bairro': venda.bairro || '-',
        'Cidade': venda.cidade || '-',
        'Estado': venda.estado || '-',
        'Vendedor': venda.vendedor?.nome || '-'
      }));
      const ws = XLSX.utils.json_to_sheet(dadosExportacao);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vendas');
      let nomeArquivo = 'vendas';
      if (dataInicio && dataFim) nomeArquivo += '_' + dataInicio + '_a_' + dataFim;
      else if (dataInicio) nomeArquivo += '_a_partir_de_' + dataInicio;
      else if (dataFim) nomeArquivo += '_ate_' + dataFim;
      else if (filtroData !== 'TODAS') nomeArquivo += '_' + filtroData.toLowerCase();
      nomeArquivo += '.xlsx';
      XLSX.writeFile(wb, nomeArquivo);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar planilha');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-finoradark-bg flex items-center justify-center">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-finoradark-bg">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white dark:bg-finoradark-card border-b border-gray-200 dark:border-finoradark-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-finoradark-text">Vendas</h1>
              <p className="text-sm text-gray-500 dark:text-finoradark-textmuted">Gerencie todas as suas vendas</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={async () => { setLoading(true); await carregarVendas(mostrandoTodas); setLoading(false); }} className="px-4 py-2 bg-gray-100 dark:bg-finoradark-card2 text-gray-700 dark:text-finoradark-textmuted rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-finoradark-border transition flex items-center gap-2">
                🔄 Atualizar
              </button>
              <button onClick={exportarParaExcel} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2">
                <Download size={20} />
                Exportar Excel
              </button>
              {isAdmin && (
                <button
                  onClick={() => { const n = !mostrandoTodas; setMostrandoTodas(n); carregarVendas(n); setPaginaAtual(1); }}
                  className={'px-4 py-2 font-semibold rounded-lg transition flex items-center gap-2 ' + (mostrandoTodas ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-600 dark:bg-finoradark-card2 text-white dark:text-finoradark-text hover:bg-gray-700 dark:hover:bg-finoradark-border')}
                >
                  {mostrandoTodas ? 'Ver Minhas Vendas' : 'Ver Todas as Vendas'}
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid md:grid-cols-5 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-finoradark-glow dark:to-[#5b4dc9] rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium opacity-90">Total em Vendas</div>
                <DollarSign size={24} />
              </div>
              <div className="text-3xl font-bold">R$ {totalVendas.toFixed(2).replace('.', ',')}</div>
              <div className="text-sm opacity-75 mt-1">{vendasFiltradas.length} vendas</div>
            </div>

            <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600 dark:text-finoradark-textmuted">Ticket Medio</div>
                <BarChart3 size={20} className="text-blue-600 dark:text-finoradark-glow" />
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-finoradark-glow">R$ {ticketMedioGeral.toFixed(2).replace('.', ',')}</div>
              <div className="text-xs text-gray-500 dark:text-finoradark-textmuted mt-2 border-t border-gray-200 dark:border-finoradark-border pt-2">
                <div className="flex items-center justify-between">
                  <span>Pagas:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">R$ {ticketMedioPagas.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600 dark:text-finoradark-textmuted">Vendas Pagas</div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                R$ {vendasFiltradas.filter(v => v.status === 'PAGO').reduce((acc, v) => acc + v.valor, 0).toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-500 dark:text-finoradark-textmuted mt-1">{totalPagas} vendas</div>
            </div>

            <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600 dark:text-finoradark-textmuted">Vendas Pendentes</div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                R$ {vendasFiltradas.filter(v => v.status === 'PENDENTE').reduce((acc, v) => acc + v.valor, 0).toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-500 dark:text-finoradark-textmuted mt-1">{totalPendentes} vendas</div>
            </div>

            <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600 dark:text-finoradark-textmuted">Taxa de Aprovacao</div>
                <ShoppingBag size={20} className="text-gray-600 dark:text-finoradark-textmuted" />
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-finoradark-glow">
                {vendasFiltradas.length > 0 ? ((totalPagas / vendasFiltradas.length) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-500 dark:text-finoradark-textmuted mt-1">{totalPagas} de {vendasFiltradas.length}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Filter size={20} className="text-gray-600 dark:text-finoradark-textmuted" />
              <span className="font-semibold text-gray-900 dark:text-finoradark-text">Filtros</span>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-finoradark-textmuted mb-2">Buscar</label>
              <input
                type="text"
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }}
                placeholder="Nome do cliente, CPF ou ID da venda..."
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 dark:text-finoradark-text placeholder:text-gray-400 dark:placeholder:text-finoradark-textmuted"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-finoradark-textmuted mb-2">Produto</label>
              <select
                value={filtroProduto}
                onChange={(e) => mudarFiltro(() => setFiltroProduto(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-finoradark-border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 dark:text-finoradark-text bg-white dark:bg-finoradark-card2 min-w-[220px]"
              >
                <option value="TODOS">Todos os produtos</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.nome}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-finoradark-textmuted mb-2">Metodo de Pagamento</label>
              <select
                value={filtroMetodo}
                onChange={(e) => mudarFiltro(() => setFiltroMetodo(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-finoradark-border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 dark:text-finoradark-text bg-white dark:bg-finoradark-card2 min-w-[220px]"
              >
                <option value="TODOS">Todos</option>
                <option value="PIX">PIX</option>
                <option value="CARTAO">Cartao</option>
                <option value="BOLETO">Boleto</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-finoradark-textmuted mb-2">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => mudarFiltro(() => setFiltroStatus(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-finoradark-border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 dark:text-finoradark-text bg-white dark:bg-finoradark-card2 min-w-[220px]"
              >
                <option value="TODAS">Todas</option>
                <option value="PENDENTE">Pendente</option>
                <option value="PAGO">Paga</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-finoradark-textmuted mb-2">Periodo</label>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filtroData === 'PERSONALIZADO' ? 'PERSONALIZADO' : filtroData}
                  onChange={(e) => mudarFiltro(() => { setFiltroData(e.target.value); setDataInicio(''); setDataFim(''); })}
                  className="px-4 py-2 border border-gray-300 dark:border-finoradark-border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 dark:text-finoradark-text bg-white dark:bg-finoradark-card2 min-w-[180px]"
                >
                  <option value="TODAS">Todas</option>
                  <option value="HOJE">Hoje</option>
                  <option value="ONTEM">Ontem</option>
                  <option value="7D">7 dias</option>
                  <option value="14D">14 dias</option>
                  <option value="30D">30 dias</option>
                </select>
                <div className="flex items-center gap-2 ml-4 border-l border-gray-300 dark:border-finoradark-border pl-4">
                  <Calendar size={18} className="text-gray-600 dark:text-finoradark-textmuted" />
                  <span className="text-sm text-gray-600 dark:text-finoradark-textmuted">Data especifica:</span>
                  <input type="date" value={dataInicio} onChange={(e) => mudarFiltro(() => { setDataInicio(e.target.value); setFiltroData('PERSONALIZADO'); })} className="px-3 py-1.5 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 dark:text-finoradark-text rounded-lg text-sm focus:ring-2 focus:ring-purple-600 outline-none" />
                  <span className="text-gray-500 dark:text-finoradark-textmuted">ate</span>
                  <input type="date" value={dataFim} onChange={(e) => mudarFiltro(() => { setDataFim(e.target.value); setFiltroData('PERSONALIZADO'); })} className="px-3 py-1.5 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 dark:text-finoradark-text rounded-lg text-sm focus:ring-2 focus:ring-purple-600 outline-none" />
                  {(dataInicio || dataFim) && (
                    <button onClick={() => mudarFiltro(() => { setDataInicio(''); setDataFim(''); setFiltroData('TODAS'); })} className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition">Limpar</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-finoradark-border bg-gray-50 dark:bg-finoradark-card2">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Produto</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Valor Bruto</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Valor Liquido</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Pagamento</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Origem</th>
                    {mostrandoTodas && <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Vendedor</th>}
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasPagina.length === 0 ? (
                    <tr>
                      <td colSpan={mostrandoTodas ? 10 : 9} className="py-12 text-center text-gray-500 dark:text-finoradark-textmuted">Nenhuma venda encontrada com os filtros selecionados</td>
                    </tr>
                  ) : (
                    vendasPagina.map((venda) => (
                      <tr key={venda.id} className="border-b border-gray-100 dark:border-finoradark-border hover:bg-gray-50 dark:hover:bg-finoradark-card2">
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-finoradark-textmuted">{formatarData(venda.createdAt)}</td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-900 dark:text-finoradark-text">{venda.produto.nome}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900 dark:text-finoradark-text">{venda.compradorNome}</div>
                          <div className="text-xs text-gray-500 dark:text-finoradark-textmuted">{venda.compradorEmail}</div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-900 dark:text-finoradark-text">R$ {venda.valor.toFixed(2).replace('.', ',')}</td>
                        <td className="py-4 px-4 font-semibold text-green-600 dark:text-green-400">
                          {venda.transacoes && venda.transacoes.length > 0 ? 'R$ ' + venda.transacoes[0].valor.toFixed(2).replace('.', ',') : '-'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ' + (venda.status === 'PAGO' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : venda.status === 'PENDENTE' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400')}>
                            <div className={'w-2 h-2 rounded-full ' + (venda.status === 'PAGO' ? 'bg-green-500' : venda.status === 'PENDENTE' ? 'bg-yellow-500' : 'bg-red-500')}></div>
                            {venda.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-finoradark-textmuted">{venda.metodoPagamento}</td>
                        <td className="py-4 px-4">
                          {venda.utmSource ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                              {venda.utmSource}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-finoradark-textmuted text-xs">—</span>
                          )}
                        </td>
                        {mostrandoTodas && (
                          <td className="py-4 px-4 text-sm text-gray-700 dark:text-finoradark-textmuted font-medium">
                            {venda.vendedor?.nome || '—'}
                          </td>
                        )}
                        <td className="py-4 px-4">
                          <button onClick={() => abrirDetalhes(venda)} className="p-2 text-purple-600 dark:text-finoradark-glow hover:bg-purple-50 dark:hover:bg-finoradark-card2 rounded-lg transition" title="Ver detalhes">
                            <Eye size={20} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-finoradark-border bg-gray-50 dark:bg-finoradark-card2">
                <span className="text-sm text-gray-600 dark:text-finoradark-textmuted">
                  Mostrando {indiceInicio + 1}–{Math.min(indiceInicio + ITENS_POR_PAGINA, vendasFiltradas.length)} de {vendasFiltradas.length} vendas
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-finoradark-border text-gray-600 dark:text-finoradark-textmuted hover:bg-white dark:hover:bg-finoradark-card disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 2)
                    .reduce((acc: (number | string)[], p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={'dots' + idx} className="px-2 text-gray-400 dark:text-finoradark-textmuted text-sm">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPaginaAtual(p as number)}
                          className={'px-3 py-1.5 rounded-lg text-sm font-semibold transition ' + (paginaAtual === p ? 'bg-purple-600 dark:bg-finoradark-glow text-white' : 'border border-gray-300 dark:border-finoradark-border text-gray-700 dark:text-finoradark-textmuted hover:bg-white dark:hover:bg-finoradark-card')}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="p-2 rounded-lg border border-gray-300 dark:border-finoradark-border text-gray-600 dark:text-finoradark-textmuted hover:bg-white dark:hover:bg-finoradark-card disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {modalAberto && vendaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-finoradark-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-finoradark-card border-b border-gray-100 dark:border-finoradark-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${vendaSelecionada.status === 'PAGO' ? 'bg-green-500' : vendaSelecionada.status === 'PENDENTE' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-finoradark-text">Detalhes da Venda</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${vendaSelecionada.status === 'PAGO' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : vendaSelecionada.status === 'PENDENTE' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                  {vendaSelecionada.status}
                </span>
              </div>
              <button onClick={fecharModal} className="p-2 hover:bg-gray-100 dark:hover:bg-finoradark-card2 rounded-lg transition text-gray-500 dark:text-finoradark-textmuted"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">

              {/* Produto */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-finoradark-card2 dark:to-finoradark-card2 rounded-xl p-4 border border-purple-200 dark:border-finoradark-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-purple-500 dark:text-finoradark-glow uppercase tracking-wide mb-1">Produto</p>
                    <p className="text-lg font-bold text-purple-900 dark:text-finoradark-text">{vendaSelecionada.produto.nome}</p>
                    {vendaSelecionada.nomePlano && <p className="text-sm text-purple-600 dark:text-finoradark-textmuted mt-0.5">{vendaSelecionada.nomePlano}</p>}
                  </div>
                  <span className="text-xs font-mono text-purple-400 dark:text-finoradark-glow bg-purple-200 dark:bg-finoradark-border px-2 py-1 rounded">#{vendaSelecionada.id.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>

              {/* PIX Pendente — Link de Pagamento */}
              {vendaSelecionada.metodoPagamento === 'PIX' && vendaSelecionada.status === 'PENDENTE' && (
                <div className="bg-amber-50 dark:bg-yellow-900/10 border-2 border-amber-300 dark:border-yellow-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">⏳</span>
                    <span className="font-bold text-amber-800 dark:text-yellow-400">PIX Aguardando Pagamento</span>
                  </div>

                  {/* Link do pedido */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-amber-700 dark:text-yellow-500 mb-1">🔗 Link da página de pagamento:</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white dark:bg-finoradark-card2 border border-amber-300 dark:border-yellow-900/40 rounded-lg px-3 py-2 font-mono text-xs text-gray-700 dark:text-finoradark-text truncate">
                        {`${typeof window !== 'undefined' ? window.location.origin : 'https://www.finorapayments.com'}/pedido/${vendaSelecionada.id}`}
                      </div>
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/pedido/${vendaSelecionada.id}`;
                          navigator.clipboard.writeText(link);
                          alert('✅ Link copiado! Envie para o cliente finalizar o pagamento.');
                        }}
                        className="px-3 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
                      >
                        Copiar Link
                      </button>
                    </div>
                  </div>

                  {/* Código PIX */}
                  {vendaSelecionada.pixCopiaECola && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-amber-700 dark:text-yellow-500 mb-1">📋 Código PIX copia e cola:</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white dark:bg-finoradark-card2 border border-amber-300 dark:border-yellow-900/40 rounded-lg px-3 py-2 font-mono text-xs text-gray-700 dark:text-finoradark-text truncate">
                          {vendaSelecionada.pixCopiaECola}
                        </div>
                        <button
                          onClick={() => { navigator.clipboard.writeText(vendaSelecionada.pixCopiaECola!); alert('Código PIX copiado!'); }}
                          className="px-3 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/pedido/${vendaSelecionada.id}`;
                        const mensagem = `Olá ${vendaSelecionada.compradorNome}! 👋\n\nSeu pedido de *${vendaSelecionada.produto.nome}* no valor de *R$ ${vendaSelecionada.valor.toFixed(2).replace('.', ',')}* ainda está aguardando pagamento.\n\nClique no link abaixo para pagar via PIX:\n${link}`;
                        const telefone = vendaSelecionada.compradorTel?.replace(/\D/g, '');
                        window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');
                      }}
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <span>📲</span> Cobrar via WhatsApp
                    </button>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/pedido/${vendaSelecionada.id}`;
                        navigator.clipboard.writeText(link);
                        alert('✅ Link copiado!');
                      }}
                      className="px-4 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition"
                    >
                      🔗 Copiar Link
                    </button>
                  </div>
                </div>
              )}

              {/* Dados do Cliente */}
              <div className="bg-gray-50 dark:bg-finoradark-card2 rounded-xl p-4 border border-gray-200 dark:border-finoradark-border">
                <p className="text-xs font-semibold text-gray-500 dark:text-finoradark-textmuted uppercase tracking-wide mb-3">Dados do Cliente</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Nome</p>
                    <p className="font-semibold text-gray-900 dark:text-finoradark-text text-sm">{vendaSelecionada.compradorNome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Email</p>
                    <p className="font-semibold text-gray-900 dark:text-finoradark-text text-sm">{vendaSelecionada.compradorEmail}</p>
                  </div>
                  {vendaSelecionada.compradorCpf && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">CPF</p>
                      <p className="font-semibold text-gray-900 dark:text-finoradark-text text-sm">{vendaSelecionada.compradorCpf}</p>
                    </div>
                  )}
                  {vendaSelecionada.compradorTel && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Telefone</p>
                      <p className="font-semibold text-gray-900 dark:text-finoradark-text text-sm">{vendaSelecionada.compradorTel}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Endereço */}
              {vendaSelecionada.cep && (
                <div className="bg-gray-50 dark:bg-finoradark-card2 rounded-xl p-4 border border-gray-200 dark:border-finoradark-border">
                  <p className="text-xs font-semibold text-gray-500 dark:text-finoradark-textmuted uppercase tracking-wide mb-3">Endereço</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">CEP</p>
                      <p className="font-semibold text-gray-900 dark:text-finoradark-text text-sm">{vendaSelecionada.cep}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Rua</p>
                      <p className="font-semibold text-gray-900 dark:text-finoradark-text text-sm">{vendaSelecionada.rua}, {vendaSelecionada.numero}</p>
                    </div>
                    {vendaSelecionada.complemento && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Complemento</p>
                        <p className="font-semibold text-gray-900 dark:text-finoradark-text text-sm">{vendaSelecionada.complemento}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Bairro</p>
                      <p className="font-semibold text-gray-900 dark:text-finoradark-text text-sm">{vendaSelecionada.bairro}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Cidade/UF</p>
                      <p className="font-semibold text-gray-900 dark:text-finoradark-text text-sm">{vendaSelecionada.cidade} - {vendaSelecionada.estado}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Informações da Venda */}
              <div className="bg-gray-50 dark:bg-finoradark-card2 rounded-xl p-4 border border-gray-200 dark:border-finoradark-border">
                <p className="text-xs font-semibold text-gray-500 dark:text-finoradark-textmuted uppercase tracking-wide mb-3">Informações da Venda</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Valor Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-finoradark-text">R$ {vendaSelecionada.valor.toFixed(2).replace('.', ',')}</p>
                    {vendaSelecionada.orderBumpsValor && vendaSelecionada.orderBumpsValor > 0 && (
                      <p className="text-xs text-gray-500 dark:text-finoradark-textmuted mt-0.5">
                        Produto: R$ {(vendaSelecionada.valor - vendaSelecionada.orderBumpsValor).toFixed(2).replace('.', ',')} + OB: R$ {vendaSelecionada.orderBumpsValor.toFixed(2).replace('.', ',')}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Método de Pagamento</p>
                    <p className="font-semibold text-gray-900 dark:text-finoradark-text text-sm">{vendaSelecionada.metodoPagamento}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${vendaSelecionada.status === 'PAGO' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : vendaSelecionada.status === 'PENDENTE' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${vendaSelecionada.status === 'PAGO' ? 'bg-green-500' : vendaSelecionada.status === 'PENDENTE' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      {vendaSelecionada.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Data</p>
                    <p className="font-semibold text-gray-900 dark:text-finoradark-text text-sm">{formatarDataHora(vendaSelecionada.createdAt)}</p>
                  </div>
                  {vendaSelecionada.vendedor && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Vendedor</p>
                      <p className="font-semibold text-gray-900 dark:text-finoradark-text text-sm">{vendaSelecionada.vendedor.nome}</p>
                    </div>
                  )}
                  {vendaSelecionada.transacoes && vendaSelecionada.transacoes.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-finoradark-textmuted">Valor Líquido</p>
                      <p className="font-bold text-green-600 dark:text-green-400 text-sm">R$ {vendaSelecionada.transacoes[0].valor.toFixed(2).replace('.', ',')}</p>
                    </div>
                  )}
                </div>

                {/* UTM */}
                {vendaSelecionada.utmSource && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-finoradark-border">
                    <p className="text-xs text-gray-500 dark:text-finoradark-textmuted mb-2">Origem da Campanha (UTM)</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-xs font-medium border border-blue-200 dark:border-blue-900/50">source: {vendaSelecionada.utmSource}</span>
                      {vendaSelecionada.utmMedium && <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-medium border border-indigo-200 dark:border-indigo-900/50">medium: {vendaSelecionada.utmMedium}</span>}
                      {vendaSelecionada.utmCampaign && <span className="px-2 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-md text-xs font-medium border border-violet-200 dark:border-violet-900/50">campaign: {vendaSelecionada.utmCampaign}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Bumps */}
              {vendaSelecionada.orderBumpsNomes && vendaSelecionada.orderBumpsNomes.length > 0 && (
                <div className="bg-purple-50 dark:bg-finoradark-card2 rounded-xl p-4 border border-purple-200 dark:border-finoradark-border">
                  <p className="text-xs font-semibold text-purple-500 dark:text-finoradark-glow uppercase tracking-wide mb-3">Order Bumps Adicionados</p>
                  <div className="space-y-2">
                    {vendaSelecionada.orderBumpsNomes.map((nome, i) => (
                      <div key={i} className="flex items-center justify-between bg-white dark:bg-finoradark-card rounded-lg px-3 py-2 border border-purple-200 dark:border-finoradark-border">
                        <span className="text-gray-900 dark:text-finoradark-text text-sm font-medium">🔥 {nome}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-purple-200 dark:border-finoradark-border flex justify-between">
                    <span className="font-semibold text-purple-900 dark:text-finoradark-text text-sm">Total Order Bumps:</span>
                    <span className="font-bold text-purple-700 dark:text-finoradark-glow">R$ {(vendaSelecionada.orderBumpsValor ?? 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              )}

              {/* Quantidade */}
              {vendaSelecionada.quantidade && vendaSelecionada.quantidade > 1 && (
                <div className="bg-gray-50 dark:bg-finoradark-card2 rounded-xl p-4 border border-gray-200 dark:border-finoradark-border">
                  <p className="text-xs font-semibold text-gray-500 dark:text-finoradark-textmuted uppercase tracking-wide mb-3">Quantidade</p>
                  <div className="flex items-center justify-between bg-white dark:bg-finoradark-card rounded-lg px-3 py-2 border border-gray-200 dark:border-finoradark-border">
                    <span className="text-gray-900 dark:text-finoradark-text text-sm font-medium">🔢 Unidades do produto</span>
                    <span className="text-gray-900 dark:text-finoradark-text text-sm font-bold">{vendaSelecionada.quantidade}x</span>
                  </div>
                </div>
              )}

              {/* Frete */}
              {vendaSelecionada.freteNome && (
                <div className="bg-blue-50 dark:bg-finoradark-card2 rounded-xl p-4 border border-blue-200 dark:border-finoradark-border">
                  <p className="text-xs font-semibold text-blue-500 dark:text-finoradark-glow uppercase tracking-wide mb-3">Frete Selecionado</p>
                  <div className="flex items-center justify-between bg-white dark:bg-finoradark-card rounded-lg px-3 py-2 border border-blue-200 dark:border-finoradark-border">
                    <span className="text-gray-900 dark:text-finoradark-text text-sm font-medium">📦 {vendaSelecionada.freteNome}</span>
                    <span className="text-gray-900 dark:text-finoradark-text text-sm font-bold">
                      {vendaSelecionada.freteValor && vendaSelecionada.freteValor > 0 ? `R$ ${vendaSelecionada.freteValor.toFixed(2).replace('.', ',')}` : 'Grátis'}
                    </span>
                  </div>
                </div>
              )}

              {/* Boleto */}
              {vendaSelecionada.boletoUrl && (
                <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-200 dark:border-orange-900/40">
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">Boleto</p>
                  <a href={vendaSelecionada.boletoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-semibold">
                    📄 Visualizar Boleto
                  </a>
                </div>
              )}

              {/* Cancelar venda (admin) */}
              {isAdmin && vendaSelecionada.status === 'PAGO' && (
                <div className="pt-2 border-t border-gray-200 dark:border-finoradark-border">
                  <button
                    onClick={() => cancelarVenda(vendaSelecionada.id)}
                    disabled={cancelando}
                    className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 text-sm"
                  >
                    {cancelando ? 'Cancelando...' : '🚫 Cancelar Venda'}
                  </button>
                  <p className="text-xs text-gray-400 dark:text-finoradark-textmuted text-center mt-2">Apenas admins podem cancelar vendas. O estorno deve ser feito manualmente.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
   </div>
  );
}