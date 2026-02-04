'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, DollarSign, Users, LogOut, ShoppingBag, BarChart3, Zap, Shield, UserCog, Trash2, FileText, Percent , Banknote } from 'lucide-react';

interface PlanoTaxa {
  id: string;
  nome: string;
}

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    produtos: number;
    vendas: number;
  };
  planoTaxa?: PlanoTaxa | null;
}

interface CurrentUser {
  nome: string;
  role?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [planos, setPlanos] = useState<PlanoTaxa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [modalTaxa, setModalTaxa] = useState<{ userId: string; userName: string } | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState('');
  const logarComoUsuario = async (userId: string, nome: string, email: string, role: string) => {
    if (!confirm(`Deseja logar como ${nome}?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/login-as', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        alert('❌ Erro ao fazer login como usuário');
        return;
      }

      const data = await response.json();

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao fazer login como usuário');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      if (user.role !== 'ADMIN') {
        alert('Acesso negado! Apenas administradores.');
        router.push('/dashboard');
        return;
      }
    }

    carregarUsuarios();
    carregarPlanos();
  }, [router]);

  const carregarPlanos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/taxas', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        setPlanos(data.planos || []);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const carregarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else if (response.status === 403) {
        alert('Acesso negado!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalTaxa = (userId: string, userName: string, planoAtualId?: string) => {
    setModalTaxa({ userId, userName });
    setPlanoSelecionado(planoAtualId || '');
  };

  const atribuirTaxa = async () => {
    if (!modalTaxa) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/users/${modalTaxa.userId}/taxa`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ planoTaxaId: planoSelecionado || null })
      });
      alert('Plano atribuído!');
      setModalTaxa(null);
      carregarUsuarios();
    } catch (error) {
      alert('Erro ao atribuir plano');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const usersFiltrados = users.filter(u =>
    u.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email.toLowerCase().includes(filtro.toLowerCase())
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
                {currentUser?.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{currentUser?.nome}</div>
              <div className="text-xs text-purple-600 font-semibold">ADMIN</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><Home size={20} /><span>Página Inicial</span></div></Link>
          <Link href="/dashboard/produtos"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><Package size={20} /><span>Produtos</span></div></Link>
          <Link href="/dashboard/vendas"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><DollarSign size={20} /><span>Vendas</span></div></Link>
          <Link href="/dashboard/afiliados"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><Users size={20} /><span>Afiliados</span></div></Link>
          <Link href="/dashboard/mercado"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><ShoppingBag size={20} /><span>Mercado</span></div></Link>
          <Link href="/dashboard/relatorios"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><BarChart3 size={20} /><span>Relatórios</span></div></Link>
          <Link href="/dashboard/testes-ab"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><Zap size={20} /><span>Testes A/B</span></div></Link>
          <div className="border-t border-gray-200 my-4"></div>
          <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 font-medium transition"><LogOut size={20} /><span>Sair</span></button>
        </nav>

        {currentUser?.role === 'ADMIN' && (
          <div className="p-4 border-t border-gray-200">
            <Link href="/dashboard/admin"><div className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition mb-2"><Shield size={20} /><span>Usuários</span></div></Link>
            <Link href="/dashboard/admin/documentos"><div className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition mb-2"><FileText size={20} /><span>Documentos</span></div></Link>
            <Link href="/dashboard/admin/taxas"><div className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"><Percent size={20} /><span>Taxas</span></div></Link>
            <Link href="/dashboard/admin/saques"><div className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"><Banknote size={20} /><span>Saques</span></div></Link>
          </div>
        )}

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">© 2026 Finora</div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🛡️ Painel Admin</h1>
              <p className="text-sm text-gray-500">Gerencie todos os usuários do sistema</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-purple-600">Total de Usuários</div>
                  <Users size={20} className="text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-600">{users.length}</div>
              </div>

              <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-green-600">Vendedores</div>
                  <UserCog size={20} className="text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {users.filter(u => u.role === 'VENDEDOR').length}
                </div>
              </div>

              <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-red-600">Administradores</div>
                  <Shield size={20} className="text-red-600" />
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {users.filter(u => u.role === 'ADMIN').length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Nome</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Plano Taxa</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Produtos</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Vendas</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Cadastro</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usersFiltrados.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{user.nome}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{user.email}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'ADMIN' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {user.planoTaxa ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            {user.planoTaxa.nome}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Sem plano</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-900 font-semibold">{user._count.produtos}</td>
                      <td className="py-4 px-4 text-gray-900 font-semibold">{user._count.vendas}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                        <button
                              onClick={() => logarComoUsuario(user.id, user.nome, user.email, user.role)}
                              className="p-2 hover:bg-purple-50 rounded-lg transition text-purple-600"
                              title="Logar como este usuário"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          <button 
                            onClick={() => abrirModalTaxa(user.id, user.nome, user.planoTaxa?.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Atribuir Taxa"
                          >
                            <Percent size={18} />
                          </button>
                          <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition">
                            <UserCog size={18} />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {modalTaxa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Atribuir Plano de Taxa</h3>
            <p className="text-gray-600 mb-6">Usuário: <span className="font-semibold">{modalTaxa.userName}</span></p>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Plano de Taxa</label>
              <select
                value={planoSelecionado}
                onChange={(e) => setPlanoSelecionado(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="">Sem plano (taxas padrão)</option>
                {planos.filter(p => p.ativo).map((plano) => (
                  <option key={plano.id} value={plano.id}>
                    {plano.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={atribuirTaxa}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Confirmar
              </button>
              <button
                onClick={() => setModalTaxa(null)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
