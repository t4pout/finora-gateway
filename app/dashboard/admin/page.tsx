'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import { Shield, Users, UserCog, Trash2, FileText, Percent, Banknote, CreditCard } from 'lucide-react';

interface PlanoTaxa {
  id: string;
  nome: string;
  ativo?: boolean;
}

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { produtos: number; vendas: number };
  planoTaxa?: PlanoTaxa | null;
  saldo?: number;
  totalSaques?: number;
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const logarComoUsuario = async (userId: string, nome: string, email: string, role: string) => {
    if (!confirm(`Deseja logar como ${nome}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/login-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) { alert('❌ Erro ao fazer login como usuário'); return; }
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
    if (!token) { router.push('/auth/login'); return; }
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      if (user.role !== 'ADMIN') { alert('Acesso negado! Apenas administradores.'); router.push('/dashboard'); return; }
    }
    carregarUsuarios();
    carregarPlanos();
  }, [router]);

  const carregarPlanos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/taxas', { headers: { 'Authorization': 'Bearer ' + token } });
      if (response.ok) { const data = await response.json(); setPlanos(data.planos || []); }
    } catch (error) { console.error('Erro:', error); }
  };

  const carregarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', { headers: { 'Authorization': 'Bearer ' + token } });
      if (response.ok) { const data = await response.json(); setUsers(data.users || []); }
      else if (response.status === 403) { alert('Acesso negado!'); router.push('/dashboard'); }
    } catch (error) { console.error('Erro:', error); }
    finally { setLoading(false); }
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
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ planoTaxaId: planoSelecionado || null })
      });
      alert('Plano atribuído!');
      setModalTaxa(null);
      carregarUsuarios();
    } catch (error) { alert('Erro ao atribuir plano'); }
  };

  const excluirUsuario = async (userId: string, userName: string) => {
    if (!confirm(`⚠️ ATENÇÃO!\n\nTem certeza que deseja EXCLUIR permanentemente o usuário "${userName}"?\n\nEsta ação NÃO pode ser desfeita e irá excluir:\n- Todos os produtos\n- Todas as vendas\n- Todo o histórico\n\nDigite SIM para confirmar.`)) return;
    const confirmacao = prompt('Digite SIM (em maiúsculas) para confirmar:');
    if (confirmacao !== 'SIM') { alert('Exclusão cancelada!'); return; }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) { alert('✅ Usuário excluído com sucesso!'); carregarUsuarios(); }
      else { const data = await response.json(); alert(`❌ Erro: ${data.error}`); }
    } catch (error) { console.error('Erro:', error); alert('❌ Erro ao excluir usuário'); }
  };

  const usersFiltrados = users.filter(u =>
    u.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={currentUser} onLogout={handleLogout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-purple-600 text-xl">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={currentUser} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Shield size={22} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-sm text-gray-500">Gerencie todos os recursos da plataforma</p>
            </div>
          </div>
        </header>

        <div className="p-8">

          {/* Cards resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Total Usuários</div>
              <div className="text-3xl font-bold text-purple-600">{users.length}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Vendedores</div>
              <div className="text-3xl font-bold text-green-600">{users.filter(u => u.role === 'VENDEDOR').length}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Admins</div>
              <div className="text-3xl font-bold text-red-600">{users.filter(u => u.role === 'ADMIN').length}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Planos de Taxa</div>
              <div className="text-3xl font-bold text-blue-600">{planos.length}</div>
            </div>
          </div>

          {/* Links rápidos admin */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link href="/dashboard/admin/documentos">
              <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-400 hover:bg-orange-50 transition cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Documentos</div>
                    <div className="text-xs text-gray-500">Verificações</div>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/admin/taxas">
              <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-green-400 hover:bg-green-50 transition cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Percent size={20} className="text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Taxas</div>
                    <div className="text-xs text-gray-500">Planos de taxa</div>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/admin/saques">
              <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Banknote size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Saques</div>
                    <div className="text-xs text-gray-500">Solicitações</div>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/admin/gateways">
              <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-400 hover:bg-purple-50 transition cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Gateways</div>
                    <div className="text-xs text-gray-500">Adquirentes</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Tabela de usuários */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Users size={20} className="text-purple-600" />
              <span>Usuários</span>
            </h2>
            <div className="mb-4">
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
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Saldo</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Saques</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Cadastro</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usersFiltrados.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-semibold text-gray-900">{user.nome}</td>
                      <td className="py-4 px-4 text-gray-600">{user.email}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {user.planoTaxa
                          ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{user.planoTaxa.nome}</span>
                          : <span className="text-gray-400 text-sm">Sem plano</span>}
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-900">{user._count.produtos}</td>
                      <td className="py-4 px-4 font-semibold text-gray-900">{user._count.vendas}</td>
                      <td className="py-4 px-4 font-semibold text-green-600">
                        R$ {(user.saldo || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-4 px-4 font-semibold text-red-500">
                        R$ {(user.totalSaques || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => logarComoUsuario(user.id, user.nome, user.email, user.role)} className="p-2 hover:bg-purple-50 rounded-lg transition text-purple-600" title="Logar como este usuário">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button onClick={() => abrirModalTaxa(user.id, user.nome, user.planoTaxa?.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Atribuir Taxa">
                            <Percent size={18} />
                          </button>
                          <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition">
                            <UserCog size={18} />
                          </button>
                          <button onClick={() => excluirUsuario(user.id, user.nome)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir usuário">
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
                  <option key={plano.id} value={plano.id}>{plano.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={atribuirTaxa} className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">Confirmar</button>
              <button onClick={() => setModalTaxa(null)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}