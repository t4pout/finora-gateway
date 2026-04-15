'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import LoadingScreen from '@/app/components/LoadingScreen';

interface Carrinho {
  id: string;
  compradorNome: string;
  compradorEmail: string;
  compradorTel: string | null;
  compradorCpf: string | null;
  produtoNome: string;
  planoNome: string | null;
  valor: number;
  status: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
}

export default function CarrinhosAbandonadosPage() {
  const router = useRouter();
  const [carrinhos, setCarrinhos] = useState<Carrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filtroStatus, setFiltroStatus] = useState('ABANDONADO');
  const [busca, setBusca] = useState('');
  const [mostrandoTodos, setMostrandoTodos] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json())
      .then(data => { setUser(data.user); carregarCarrinhos(false); });
  }, []);

  const carregarCarrinhos = async (verTodos: boolean) => {
    const token = localStorage.getItem('token');
    const url = verTodos ? '/api/carrinho-abandonado?todos=true' : '/api/carrinho-abandonado';
    const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    setCarrinhos(data.carrinhos || []);
    setLoading(false);
  };

  const carrinhosFiltrados = carrinhos.filter(c => {
    if (filtroStatus !== 'TODOS' && c.status !== filtroStatus) return false;
    if (busca) {
      const b = busca.toLowerCase();
      return c.compradorNome.toLowerCase().includes(b) ||
        c.compradorEmail.toLowerCase().includes(b) ||
        c.produtoNome.toLowerCase().includes(b);
    }
    return true;
  });

  const totalValor = carrinhosFiltrados.reduce((acc, c) => acc + c.valor, 0);
  const totalAbandonados = carrinhos.filter(c => c.status === 'ABANDONADO').length;
  const totalConvertidos = carrinhos.filter(c => c.status === 'CONVERTIDO').length;
  const taxaConversao = carrinhos.length > 0 ? ((totalConvertidos / carrinhos.length) * 100).toFixed(1) : '0';

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🛒 Carrinhos Abandonados</h1>
              <p className="text-sm text-gray-500">Clientes que iniciaram mas não finalizaram a compra</p>
            </div>
            <div className="flex items-center gap-3">
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => { const n = !mostrandoTodos; setMostrandoTodos(n); carregarCarrinhos(n); }}
                  className={'px-4 py-2 font-semibold rounded-lg transition ' + (mostrandoTodos ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-600 text-white hover:bg-gray-700')}
                >
                  {mostrandoTodos ? 'Ver Meus Carrinhos' : 'Ver Todos'}
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Cards de resumo */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
              <div className="text-sm font-medium opacity-90">Abandonados</div>
              <div className="text-3xl font-bold mt-1">{totalAbandonados}</div>
              <div className="text-sm opacity-75 mt-1">carrinhos</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-sm text-gray-600">Convertidos</div>
              <div className="text-3xl font-bold text-green-600 mt-1">{totalConvertidos}</div>
              <div className="text-sm text-gray-500 mt-1">finalizaram</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-sm text-gray-600">Taxa de Conversão</div>
              <div className="text-3xl font-bold text-purple-600 mt-1">{taxaConversao}%</div>
              <div className="text-sm text-gray-500 mt-1">dos carrinhos</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-sm text-gray-600">Valor em Risco</div>
              <div className="text-3xl font-bold text-orange-600 mt-1">R$ {carrinhos.filter(c => c.status === 'ABANDONADO').reduce((acc, c) => acc + c.valor, 0).toFixed(2).replace('.', ',')}</div>
              <div className="text-sm text-gray-500 mt-1">abandonados</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="text"
                placeholder="Buscar por nome, email ou produto..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="flex-1 min-w-64 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900"
              />
              <div className="flex gap-2">
                <button onClick={() => setFiltroStatus('TODOS')} className={'px-4 py-2 rounded-lg font-semibold transition ' + (filtroStatus === 'TODOS' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}>Todos</button>
                <button onClick={() => setFiltroStatus('ABANDONADO')} className={'px-4 py-2 rounded-lg font-semibold transition ' + (filtroStatus === 'ABANDONADO' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}>Abandonados</button>
                <button onClick={() => setFiltroStatus('CONVERTIDO')} className={'px-4 py-2 rounded-lg font-semibold transition ' + (filtroStatus === 'CONVERTIDO' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}>Convertidos</button>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Produto</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Valor</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Origem</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {carrinhosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">Nenhum carrinho encontrado</td>
                    </tr>
                  ) : carrinhosFiltrados.map(c => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                        <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{c.compradorNome}</div>
                        <div className="text-sm text-gray-500">{c.compradorEmail}</div>
                        {c.compradorTel && <div className="text-xs text-gray-400">{c.compradorTel}</div>}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{c.produtoNome}</div>
                        {c.planoNome && <div className="text-sm text-gray-500">{c.planoNome}</div>}
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-900">R$ {c.valor.toFixed(2).replace('.', ',')}</td>
                      <td className="py-4 px-4">
                        <span className={'px-3 py-1 rounded-full text-xs font-semibold ' + (c.status === 'ABANDONADO' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                          {c.status === 'ABANDONADO' ? '🛒 Abandonado' : '✅ Convertido'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {c.utmSource ? (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200">{c.utmSource}</span>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="py-4 px-4">
                        {c.status === 'ABANDONADO' && c.compradorTel && (
                          <a href={'https://wa.me/55' + c.compradorTel.replace(/\D/g, '')} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition">WhatsApp</a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}