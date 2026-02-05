'use client';

import Sidebar from '@/app/components/Sidebar';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Package, 
  DollarSign, 
  Users, 
  LogOut,
  ShoppingBag,
  TrendingUp,
  Award,
  Filter,
  Search,
  Eye,
  UserPlus
, Zap, BarChart3 , Shield , Wallet , ChevronDown } from 'lucide-react';

interface Produto {
  vendedor?: string;
  isMeuProduto?: boolean;
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  preco: number;
  comissao: number;
  imagem: string;
  vendas?: number;
}

interface User {
  nome: string;
}

export default function MercadoPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendasOpen, setVendasOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [ordenacao, setOrdenacao] = useState('COMISSAO');
  const [busca, setBusca] = useState('');

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

    carregarProdutos();
  }, [router]);

  const carregarProdutos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/mercado', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        setProdutos(data.produtos || []);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const solicitarAfiliacao = async (produtoId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/mercado/solicitar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ produtoId })
      });

      if (response.ok) {
        alert('Solicitação enviada com sucesso!');
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao solicitar');
      }
    } catch (error) {
      alert('Erro ao conectar');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  let produtosFiltrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'TODOS' || p.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  produtosFiltrados = [...produtosFiltrados].sort((a, b) => {
    if (ordenacao === 'COMISSAO') return b.comissao - a.comissao;
    if (ordenacao === 'VENDAS') return (b.vendas || 0) - (a.vendas || 0);
    if (ordenacao === 'PRECO') return b.preco - a.preco;
    return 0;
  });

  const topProdutos = [...produtos]
    .sort((a, b) => (b.vendas || 0) - (a.vendas || 0))
    .slice(0, 3);

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mercado de Produtos</h1>
            <p className="text-sm text-gray-500">Encontre os melhores produtos para afiliar</p>
          </div>
        </header>

        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Award size={24} className="text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">Hall da Fama</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {topProdutos.map((p, index) => (
                <div key={p.id} className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl opacity-20">
                    ðŸ†
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl font-bold mb-2">#{index + 1}</div>
                    <h3 className="text-xl font-bold mb-1">{p.nome}</h3>
                    <div className="text-sm opacity-90 mb-3">{p.vendas || 0} vendas</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{p.comissao}%</div>
                      <div className="text-sm">Comissão</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="DIGITAL">Digital</option>
                <option value="FISICO">FÃ­sico</option>
              </select>

              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="COMISSAO">Maior Comissão</option>
                <option value="VENDAS">Mais Vendidos</option>
                <option value="PRECO">Maior Preço</option>
              </select>
            </div>
          </div>

          {produtosFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-600">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {produtosFiltrados.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
                  {p.imagem ? (
                    <img src={p.imagem} alt={p.nome} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center">
                      <Package size={48} className="text-white" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      {p.vendedor && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          por {p.vendedor}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                        {p.tipo}
                      </span>
                      {(p.vendas || 0) > 0 && (
                        <span className="text-xs text-gray-500">
                          {p.vendas} vendas
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{p.nome}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{p.descricao}</p>
                    
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <div className="text-sm text-gray-500">Preço</div>
                        <div className="text-xl font-bold text-gray-900">
                          R$ {p.preco.toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Comissão</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {p.comissao}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center space-x-2">
                        <Eye size={16} />
                        <span>Detalhes</span>
                      </button>
                      <button
                        onClick={() => solicitarAfiliacao(p.id)}
                        disabled={p.isMeuProduto}
                        className={`flex-1 px-4 py-2 rounded-lg transition flex items-center justify-center space-x-2 ${
                          p.isMeuProduto 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        <UserPlus size={16} />
                        <span>{p.isMeuProduto ? 'Meu Produto' : 'Afiliar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}



