'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Package, 
  DollarSign, 
  Users, ShoppingBag, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  Search
} from 'lucide-react';

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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/produtos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (response.ok) {
        alert('Produto excluÃ­do!');
        carregarProdutos();
      }
    } catch (error) {
      alert('Erro ao excluir');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
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
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl"></div>
            <div>
              <div className="text-xl font-bold text-gray-900">Finora</div>
              <div className="text-xs text-gray-500">Pagamentos que fluem</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-lg">
                {user?.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {user?.nome}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition">
              <Home size={20} />
              <span>PÃ¡gina Inicial</span>
            </div>
          </Link>

          <Link href="/dashboard/produtos">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-purple-50 text-purple-600 font-semibold">
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

          <Link href="/dashboard/afiliados">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition">
              <Users size={20} />
              <span>Afiliados</span>
            </div>
          </Link>

          <div className="border-t border-gray-200 my-4"></div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 font-medium transition"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">Â© 2026 Finora</div>
        </div>
      </aside>

      {/* Main Content */}
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
          {/* Busca */}
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

          {/* Lista de Produtos */}
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {produtosFiltrados.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
                  {p.imagem ? (
                    <img
                      src={p.imagem}
                      alt={p.nome}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center">
                      <Package size={48} className="text-white" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 flex-1">{p.nome}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{p.descricao}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          R$ {p.preco.toFixed(2).replace('.', ',')}
                        </div>
                        <div className="text-xs text-gray-500">{p.tipo}</div>
                      </div>
                    </div>
                    
                    <Link href={`/dashboard/produtos/${p.id}/detalhes`} className="w-full">
                      <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold">
                        Ver Detalhes
                      </button>
                    </Link>
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




