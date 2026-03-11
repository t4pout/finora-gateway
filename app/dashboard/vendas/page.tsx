'use client';

import Sidebar from '@/app/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, ShoppingBag, BarChart3, Filter, Calendar, Eye, X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { agoraBrasil, toBrasil, formatarData, formatarHora, formatarDataHora, inicioDiaBrasil, fimDiaBrasil, inicioDiasAtras, isOntem, parseDateInput } from '@/lib/date-brasil';

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

export default function VendasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('TODAS');
  const [filtroData, setFiltroData] = useState('TODAS');
  const [filtroProduto, setFiltroProduto] = useState('TODOS');
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mostrandoTodas, setMostrandoTodas] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [busca, setBusca] = useState('');
   
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
      const url = mostrarTodas ? '/api/vendas?todas=true' : '/api/vendas';
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
  const fecharModal = () => { setModalAberto(false); setVendaSelecionada(null); };

  // Helper: aplica mudança de filtro e reseta página
  const mudarFiltro = (fn: () => void) => { fn(); setPaginaAtual(1); };

  const vendasFiltradas = vendas.filter(v => {
    if (filtroStatus !== 'TODAS' && v.status !== filtroStatus) return false;
    if (busca.trim()) {
      const b = busca.trim().toLowerCase();
      const matchNome = v.compradorNome?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      const matchCpf = v.compradorCpf?.replace(/\D/g, '').includes(b.replace(/\D/g, ''));
      const matchId = v.id?.toLowerCase().includes(b);
      if (!matchNome && !matchCpf && !matchId) return false;
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
      return true;
    }

    if (filtroData === 'ONTEM') {
      return isOntem(v.createdAt);
    } else if (filtroData === 'HOJE') {
      const dataVenda = toBrasil(v.createdAt);
      dataVenda.setHours(0, 0, 0, 0);
      const hoje = agoraBrasil();
      hoje.setHours(0, 0, 0, 0);
      return dataVenda.getTime() === hoje.getTime();
    } else if (filtroData === '7D') {
      return toBrasil(v.createdAt) >= inicioDiasAtras(7);
    } else if (filtroData === '14D') {
      return toBrasil(v.createdAt) >= inicioDiasAtras(14);
    } else if (filtroData === '30D') {
      return toBrasil(v.createdAt) >= inicioDiasAtras(30);
    }

    return true;
  });

  // Paginação
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
              <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
              <p className="text-sm text-gray-500">Gerencie todas as suas vendas</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={exportarParaExcel} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2">
                <Download size={20} />
                Exportar Excel
              </button>
              {isAdmin && (
                <button
                  onClick={() => { const n = !mostrandoTodas; setMostrandoTodas(n); carregarVendas(n); setPaginaAtual(1); }}
                  className={'px-4 py-2 font-semibold rounded-lg transition flex items-center gap-2 ' + (mostrandoTodas ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-600 text-white hover:bg-gray-700')}
                >
                  {mostrandoTodas ? 'Ver Minhas Vendas' : 'Ver Todas as Vendas'}
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid md:grid-cols-5 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium opacity-90">Total em Vendas</div>
                <DollarSign size={24} />
              </div>
              <div className="text-3xl font-bold">R$ {totalVendas.toFixed(2).replace('.', ',')}</div>
              <div className="text-sm opacity-75 mt-1">{vendasFiltradas.length} vendas</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Ticket Medio</div>
                <BarChart3 size={20} className="text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">R$ {ticketMedioGeral.toFixed(2).replace('.', ',')}</div>
              <div className="text-xs text-gray-500 mt-2 border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between">
                  <span>Pagas:</span>
                  <span className="font-semibold text-green-600">R$ {ticketMedioPagas.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Vendas Pagas</div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-3xl font-bold text-green-600">
                R$ {vendasFiltradas.filter(v => v.status === 'PAGO').reduce((acc, v) => acc + v.valor, 0).toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-500 mt-1">{totalPagas} vendas</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Vendas Pendentes</div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
              <div className="text-3xl font-bold text-yellow-600">
                R$ {vendasFiltradas.filter(v => v.status === 'PENDENTE').reduce((acc, v) => acc + v.valor, 0).toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-500 mt-1">{totalPendentes} vendas</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Taxa de Aprovacao</div>
                <ShoppingBag size={20} className="text-gray-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {vendasFiltradas.length > 0 ? ((totalPagas / vendasFiltradas.length) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-500 mt-1">{totalPagas} de {vendasFiltradas.length}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Filter size={20} className="text-gray-600" />
              <span className="font-semibold text-gray-900">Filtros</span>
            </div>
           <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <input
                type="text"
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }}
                placeholder="Nome do cliente, CPF ou ID da venda..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900"
              />
            </div>

            {/* Filtro por Produto */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Produto</label>
              <select
                value={filtroProduto}
                onChange={(e) => mudarFiltro(() => setFiltroProduto(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 bg-white min-w-[220px]"
              >
                <option value="TODOS">Todos os produtos</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.nome}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex gap-2">
                <button onClick={() => mudarFiltro(() => setFiltroStatus('TODAS'))} className={'px-4 py-2 rounded-lg font-semibold transition ' + (filtroStatus === 'TODAS' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}>Todas</button>
                <button onClick={() => mudarFiltro(() => setFiltroStatus('PENDENTE'))} className={'px-4 py-2 rounded-lg font-semibold transition ' + (filtroStatus === 'PENDENTE' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}>Pendente</button>
                <button onClick={() => mudarFiltro(() => setFiltroStatus('PAGO'))} className={'px-4 py-2 rounded-lg font-semibold transition ' + (filtroStatus === 'PAGO' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}>Paga</button>
                <button onClick={() => mudarFiltro(() => setFiltroStatus('CANCELADA'))} className={'px-4 py-2 rounded-lg font-semibold transition ' + (filtroStatus === 'CANCELADA' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}>Cancelada</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Periodo</label>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => mudarFiltro(() => { setFiltroData('TODAS'); setDataInicio(''); setDataFim(''); })} className={'px-3 py-1.5 rounded-lg text-sm font-semibold transition ' + (filtroData === 'TODAS' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>Todas</button>
                <button onClick={() => mudarFiltro(() => { setFiltroData('HOJE'); setDataInicio(''); setDataFim(''); })} className={'px-3 py-1.5 rounded-lg text-sm font-semibold transition ' + (filtroData === 'HOJE' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>Hoje</button>
                <button onClick={() => mudarFiltro(() => { setFiltroData('ONTEM'); setDataInicio(''); setDataFim(''); })} className={'px-3 py-1.5 rounded-lg text-sm font-semibold transition ' + (filtroData === 'ONTEM' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>Ontem</button>
                <button onClick={() => mudarFiltro(() => { setFiltroData('7D'); setDataInicio(''); setDataFim(''); })} className={'px-3 py-1.5 rounded-lg text-sm font-semibold transition ' + (filtroData === '7D' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>7 dias</button>
                <button onClick={() => mudarFiltro(() => { setFiltroData('14D'); setDataInicio(''); setDataFim(''); })} className={'px-3 py-1.5 rounded-lg text-sm font-semibold transition ' + (filtroData === '14D' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>14 dias</button>
                <button onClick={() => mudarFiltro(() => { setFiltroData('30D'); setDataInicio(''); setDataFim(''); })} className={'px-3 py-1.5 rounded-lg text-sm font-semibold transition ' + (filtroData === '30D' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>30 dias</button>
                <div className="flex items-center gap-2 ml-4 border-l border-gray-300 pl-4">
                  <Calendar size={18} className="text-gray-600" />
                  <span className="text-sm text-gray-600">Data especifica:</span>
                  <input type="date" value={dataInicio} onChange={(e) => mudarFiltro(() => { setDataInicio(e.target.value); setFiltroData('PERSONALIZADO'); })} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 outline-none" />
                  <span className="text-gray-500">ate</span>
                  <input type="date" value={dataFim} onChange={(e) => mudarFiltro(() => { setDataFim(e.target.value); setFiltroData('PERSONALIZADO'); })} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 outline-none" />
                  {(dataInicio || dataFim) && (
                    <button onClick={() => mudarFiltro(() => { setDataInicio(''); setDataFim(''); setFiltroData('TODAS'); })} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition">Limpar</button>
                  )}
                </div>
              </div>
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
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Valor Liquido</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Pagamento</th>
<th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Origem</th>
<th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasPagina.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">Nenhuma venda encontrada com os filtros selecionados</td>
                    </tr>
                  ) : (
                    vendasPagina.map((venda) => (
                      <tr key={venda.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-gray-600">{formatarData(venda.createdAt)}</td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-900">{venda.produto.nome}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">{venda.compradorNome}</div>
                          <div className="text-xs text-gray-500">{venda.compradorEmail}</div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-900">R$ {venda.valor.toFixed(2).replace('.', ',')}</td>
                        <td className="py-4 px-4 font-semibold text-green-600">
                          {venda.transacoes && venda.transacoes.length > 0 ? 'R$ ' + venda.transacoes[0].valor.toFixed(2).replace('.', ',') : '-'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ' + (venda.status === 'PAGO' ? 'bg-green-100 text-green-700' : venda.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>
                            <div className={'w-2 h-2 rounded-full ' + (venda.status === 'PAGO' ? 'bg-green-500' : venda.status === 'PENDENTE' ? 'bg-yellow-500' : 'bg-red-500')}></div>
                            {venda.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{venda.metodoPagamento}</td>
<td className="py-4 px-4">
  {venda.utmSource ? (
    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      {venda.utmSource}
    </span>
  ) : (
    <span className="text-gray-400 text-xs">—</span>
  )}
</td>
<td className="py-4 px-4">
  <button onClick={() => abrirDetalhes(venda)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Ver detalhes">
                            <Eye size={20} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <span className="text-sm text-gray-600">
                  Mostrando {indiceInicio + 1}–{Math.min(indiceInicio + ITENS_POR_PAGINA, vendasFiltradas.length)} de {vendasFiltradas.length} vendas
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
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
                        <span key={'dots' + idx} className="px-2 text-gray-400 text-sm">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPaginaAtual(p as number)}
                          className={'px-3 py-1.5 rounded-lg text-sm font-semibold transition ' + (paginaAtual === p ? 'bg-purple-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-white')}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes da Venda</h2>
              <button onClick={fecharModal} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Produto</h3>
                <p className="text-lg font-bold text-purple-700">{vendaSelecionada.produto.nome}</p>
                <p className="text-sm text-purple-600">ID: {vendaSelecionada.id.substring(0, 8)}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Dados do Cliente</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="text-sm text-gray-600">Nome</label><p className="font-semibold text-gray-900">{vendaSelecionada.compradorNome}</p></div>
                  <div><label className="text-sm text-gray-600">Email</label><p className="font-semibold text-gray-900">{vendaSelecionada.compradorEmail}</p></div>
                  {vendaSelecionada.compradorCpf && <div><label className="text-sm text-gray-600">CPF</label><p className="font-semibold text-gray-900">{vendaSelecionada.compradorCpf}</p></div>}
                  {vendaSelecionada.compradorTel && <div><label className="text-sm text-gray-600">Telefone</label><p className="font-semibold text-gray-900">{vendaSelecionada.compradorTel}</p></div>}
                </div>
                {vendaSelecionada.metodoPagamento === 'PIX' && vendaSelecionada.pixCopiaECola && vendaSelecionada.status === 'PENDENTE' && (
                  <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-600 font-semibold">PIX Pendente - Codigo para Cobranca</span>
                    </div>
                    <p className="text-xs text-yellow-700 mb-2">Use este codigo PIX para enviar ao cliente via WhatsApp:</p>
                    <div className="relative">
                      <div className="bg-white p-3 rounded-lg font-mono text-xs break-all border border-yellow-300">{vendaSelecionada.pixCopiaECola}</div>
                      <button onClick={() => { navigator.clipboard.writeText(vendaSelecionada.pixCopiaECola!); alert('Codigo PIX copiado!'); }} className="absolute top-2 right-2 px-3 py-1.5 bg-yellow-600 text-white text-xs font-semibold rounded-lg hover:bg-yellow-700 transition">Copiar</button>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          const mensagem = 'Ola ' + vendaSelecionada.compradorNome + '! Seu pedido de ' + vendaSelecionada.produto.nome + ' no valor de R$ ' + vendaSelecionada.valor.toFixed(2).replace('.', ',') + ' esta pendente.\n\nCodigo PIX:\n' + vendaSelecionada.pixCopiaECola;
                          const telefone = vendaSelecionada.compradorTel?.replace(/\D/g, '');
                          window.open('https://wa.me/55' + telefone + '?text=' + encodeURIComponent(mensagem), '_blank');
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                      >Cobrar via WhatsApp</button>
                      <button onClick={() => { navigator.clipboard.writeText(vendaSelecionada.pixCopiaECola!); alert('Codigo PIX copiado!'); }} className="px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition">Copiar Codigo</button>
                    </div>
                  </div>
                )}
              </div>
              {vendaSelecionada.cep && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Endereco</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="text-sm text-gray-600">CEP</label><p className="font-semibold text-gray-900">{vendaSelecionada.cep}</p></div>
                    <div><label className="text-sm text-gray-600">Rua</label><p className="font-semibold text-gray-900">{vendaSelecionada.rua}</p></div>
                    <div><label className="text-sm text-gray-600">Numero</label><p className="font-semibold text-gray-900">{vendaSelecionada.numero}</p></div>
                    {vendaSelecionada.complemento && <div><label className="text-sm text-gray-600">Complemento</label><p className="font-semibold text-gray-900">{vendaSelecionada.complemento}</p></div>}
                    <div><label className="text-sm text-gray-600">Bairro</label><p className="font-semibold text-gray-900">{vendaSelecionada.bairro}</p></div>
                    <div><label className="text-sm text-gray-600">Cidade/UF</label><p className="font-semibold text-gray-900">{vendaSelecionada.cidade} - {vendaSelecionada.estado}</p></div>
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Informacoes da Venda</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Valor Total</label>
                    <p className="text-2xl font-bold text-gray-900">R$ {vendaSelecionada.valor.toFixed(2).replace('.', ',')}</p>
                    {vendaSelecionada.orderBumpsValor && vendaSelecionada.orderBumpsValor > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{'Produto: R$ ' + (vendaSelecionada.valor - vendaSelecionada.orderBumpsValor).toFixed(2).replace('.', ',') + ' + Order Bumps: R$ ' + vendaSelecionada.orderBumpsValor.toFixed(2).replace('.', ',')}</p>
                    )}
                  </div>
                  <div><label className="text-sm text-gray-600">Metodo de Pagamento</label><p className="font-semibold text-gray-900">{vendaSelecionada.metodoPagamento}</p></div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <span className={'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ' + (vendaSelecionada.status === 'PAGO' ? 'bg-green-100 text-green-700' : vendaSelecionada.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>{vendaSelecionada.status}</span>
                  </div>
                  <div><label className="text-sm text-gray-600">Data</label><p className="font-semibold text-gray-900">{formatarDataHora(vendaSelecionada.createdAt)}</p></div>
                  {vendaSelecionada.utmSource && (
  <div className="md:col-span-2">
    <label className="text-sm text-gray-600">Origem da Campanha (UTM)</label>
    <div className="flex flex-wrap gap-2 mt-1">
      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-200">source: {vendaSelecionada.utmSource}</span>
      {vendaSelecionada.utmMedium && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium border border-indigo-200">medium: {vendaSelecionada.utmMedium}</span>}
      {vendaSelecionada.utmCampaign && <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-md text-sm font-medium border border-violet-200">campaign: {vendaSelecionada.utmCampaign}</span>}
    </div>
  </div>
)}
                </div>
              </div>
              {vendaSelecionada.orderBumpsNomes && vendaSelecionada.orderBumpsNomes.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="font-semibold text-purple-900 mb-3">Order Bumps Adicionados</h3>
                  <div className="space-y-2">
                    {vendaSelecionada.orderBumpsNomes.map((nome, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-purple-200">
                        <span className="text-gray-900 font-medium">{nome}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-purple-200 flex justify-between">
                    <span className="font-semibold text-purple-900">Total Order Bumps:</span>
                    <span className="font-bold text-purple-700">{'R$ ' + (vendaSelecionada.orderBumpsValor ? vendaSelecionada.orderBumpsValor.toFixed(2).replace('.', ',') : '0,00')}</span>
                  </div>
                </div>
              )}
              {vendaSelecionada.boletoUrl && (
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Boleto</label>
                  <a href={vendaSelecionada.boletoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Ver Boleto</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}