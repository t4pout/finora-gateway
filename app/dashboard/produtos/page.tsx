'use client';

import Sidebar from '@/app/components/Sidebar';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingScreen from '@/app/components/LoadingScreen';
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-finoradark-text">Meus Produtos</h1>
              <p className="text-sm text-gray-500 dark:text-finoradark-textmuted">Gerencie seus produtos fà­sicos e digitais</p>
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
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-finoradark-card border border-gray-200 dark:border-finoradark-border dark:text-finoradark-text rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {produtosFiltrados.length === 0 ? (
            <div className="bg-white dark:bg-finoradark-card rounded-xl p-12 text-center border border-gray-200 dark:border-finoradark-border">
              <Package size={64} className="mx-auto text-gray-300 dark:text-finoradark-border mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-finoradark-text mb-2">
                {busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              </h3>
              <p className="text-gray-600 dark:text-finoradark-textmuted mb-6">
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
                <div key={produto.id} className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border overflow-hidden hover:shadow-lg dark:hover:shadow-none transition">
                  {produto.imagem ? (
                    <img src={produto.imagem} alt={produto.nome} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-purple-600 to-purple-500 dark:from-finoradark-glow dark:to-[#5b4dc9] flex items-center justify-center">
                      <Package size={48} className="text-white" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-finoradark-text flex-1">{produto.nome}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        produto.status === 'ATIVO' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-finoradark-card2 text-gray-700 dark:text-finoradark-textmuted'
                      }`}>
                        {produto.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-finoradark-textmuted mb-4 line-clamp-2">{produto.descricao}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-finoradark-glow">
                          R$ {produto.preco.toFixed(2).replace('.', ',')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-finoradark-textmuted">{produto.tipo}</div>
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

