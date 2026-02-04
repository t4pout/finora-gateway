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
  Plus,
  Search,
  Eye
, Zap, BarChart3 , Shield , Wallet , ChevronDown } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  preco: number;
  status: string;
  imagem: string;
}

interface User {
  nome: string;
}

export default function ProdutosPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendasOpen, setVendasOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
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
      const response = await fetch('/api/produtos', {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const verDetalhes = (id: string) => {
    const url = '/dashboard/detalhes/' + id;
    console.log('Navegando para:', url);
    router.push(url);
  };

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

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
              <h1 className="text-2xl font-bold text-gray-900">Meus Produtos</h1>
              <p className="text-sm text-gray-500">Gerencie seus produtos fÃ­sicos e digitais</p>
            </div>

            <Link href="/dashboard/produtos/novo">
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center space-x-2">
                <Plus size={20} />
                <span>Novo Produto</span>
              </button>
            </Link>
          </div>
        </header>

        <div className="p-8">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {produtosFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <Package size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              </h3>
              <p className="text-gray-600 mb-6">
                {busca ? 'Tente outra busca' : 'Comece criando seu primeiro produto!'}
              </p>
              {!busca && (
                <Link href="/dashboard/produtos/novo">
                  <button className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                    Criar Primeiro Produto
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {produtosFiltrados.map((produto) => (
                <div key={produto.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
                  {produto.imagem ? (
                    <img src={produto.imagem} alt={produto.nome} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center">
                      <Package size={48} className="text-white" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 flex-1">{produto.nome}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        produto.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {produto.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{produto.descricao}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          R$ {produto.preco.toFixed(2).replace('.', ',')}
                        </div>
                        <div className="text-xs text-gray-500">{produto.tipo}</div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => verDetalhes(produto.id)}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center justify-center space-x-2"
                    >
                      <Eye size={18} />
                      <span>Ver Detalhes</span>
                    </button>
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

