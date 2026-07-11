'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';import { Shield, Users, UserCog, Trash2, FileText, Percent, Banknote, CreditCard, TrendingUp, ArrowDownToLine, Wallet } from 'lucide-react';
import LoadingScreen from '@/app/components/LoadingScreen';

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

  // Resumo financeiro calculado a partir dos usuários já carregados
  const totalARepassar = users.reduce((acc, u) => acc + (u.saldo || 0), 0);
  const totalJaSacado = users.reduce((acc, u) => acc + (u.totalSaques || 0), 0);
  const vendedoresComSaldo = users.filter(u => (u.saldo || 0) > 0).length;

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-finoradark-bg">
        <Sidebar user={currentUser} onLogout={handleLogout} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-finoradark-bg">
      <Sidebar user={currentUser} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white dark:bg-finoradark-card border-b border-gray-200 dark:border-finoradark-border px-8 py-6 pl-16 lg:pl-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-finoradark-card2 rounded-xl flex items-center justify-center">
              <Shield size={22} className="text-purple-600 dark:text-finoradark-glow" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-finoradark-text">Painel Administrativo</h1>
              <p className="text-sm text-gray-500 dark:text-finoradark-textmuted">Gerencie todos os recursos da plataforma</p>
            </div>
          </div>
        </header>

        <div className="p-8">

          {/* Cards resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-5">
              <div className="text-sm text-gray-500 dark:text-finoradark-textmuted mb-1">Total Usuários</div>
              <div className="text-3xl font-bold text-purple-600 dark:text-finoradark-glow">{users.length}</div>
            </div>
            <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-5">
              <div className="text-sm text-gray-500 dark:text-finoradark-textmuted mb-1">Vendedores</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{users.filter(u => u.role === 'VENDEDOR').length}</div>
            </div>
            <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-5">
              <div className="text-sm text-gray-500 dark:text-finoradark-textmuted mb-1">Admins</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{users.filter(u => u.role === 'ADMIN').length}</div>
            </div>
            <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-5">
              <div className="text-sm text-gray-500 dark:text-finoradark-textmuted mb-1">Planos de Taxa</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{planos.length}</div>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-500 dark:text-finoradark-textmuted uppercase tracking-wide mb-3">💰 Resumo Financeiro</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-purple-500 dark:from-finoradark-glow dark:to-[#5b4dc9] rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium opacity-90">Total a Repassar</div>
                  <Wallet size={22} />
                </div>
                <div className="text-3xl font-bold mb-1">R$ {totalARepassar.toFixed(2).replace('.', ',')}</div>
                <div className="text-xs opacity-75">Saldo disponível de todos os vendedores</div>
              </div>

              <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 dark:text-finoradark-textmuted">Total Já Sacado</div>
                  <ArrowDownToLine size={20} className="text-gray-600 dark:text-finoradark-textmuted" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-finoradark-text mb-1">R$ {totalJaSacado.toFixed(2).replace('.', ',')}</div>
                <div className="text-xs text-gray-500 dark:text-finoradark-textmuted">Histórico de saques de todos os usuários</div>
              </div>

              <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 dark:text-finoradark-textmuted">Vendedores com Saldo</div>
                  <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{vendedoresComSaldo}</div>
                <div className="text-xs text-gray-500 dark:text-finoradark-textmuted">de {users.length} usuários com saldo disponível</div>
              </div>
            </div>
          </div>

          {/* Links rápidos admin */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link href="/dashboard/admin/documentos">
              <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-5 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-finoradark-text">Documentos</div>
                    <div className="text-xs text-gray-500 dark:text-finoradark-textmuted">Verificações</div>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/admin/taxas">
              <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-5 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 transition cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Percent size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-finoradark-text">Taxas</div>
                    <div className="text-xs text-gray-500 dark:text-finoradark-textmuted">Planos de taxa</div>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/admin/saques">
              <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-5 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Banknote size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-finoradark-text">Saques</div>
                    <div className="text-xs text-gray-500 dark:text-finoradark-textmuted">Solicitações</div>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/admin/gateways">
              <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-5 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-finoradark-card2 transition cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-finoradark-card2 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-purple-600 dark:text-finoradark-glow" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-finoradark-text">Gateways</div>
                    <div className="text-xs text-gray-500 dark:text-finoradark-textmuted">Adquirentes</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Tabela de usuários */}
          <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-finoradark-text mb-4 flex items-center space-x-2">
              <Users size={20} className="text-purple-600 dark:text-finoradark-glow" />
              <span>Usuários</span>
            </h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 dark:text-finoradark-text rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-finoradark-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Nome</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Plano Taxa</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Produtos</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Vendas</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Saldo</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Saques</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Cadastro</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usersFiltrados.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-finoradark-border hover:bg-gray-50 dark:hover:bg-finoradark-card2">
                      <td className="py-4 px-4 font-semibold text-gray-900 dark:text-finoradark-text">{user.nome}</td>
                      <td className="py-4 px-4 text-gray-600 dark:text-finoradark-textmuted">{user.email}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {user.planoTaxa
                          ? <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">{user.planoTaxa.nome}</span>
                          : <span className="text-gray-400 dark:text-finoradark-textmuted text-sm">Sem plano</span>}
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-900 dark:text-finoradark-text">{user._count.produtos}</td>
                      <td className="py-4 px-4 font-semibold text-gray-900 dark:text-finoradark-text">{user._count.vendas}</td>
                      <td className="py-4 px-4 font-semibold text-green-600 dark:text-green-400">
                        R$ {(user.saldo || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-4 px-4 font-semibold text-red-500 dark:text-red-400">
                        R$ {(user.totalSaques || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-finoradark-textmuted text-sm">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => logarComoUsuario(user.id, user.nome, user.email, user.role)} className="p-2 hover:bg-purple-50 dark:hover:bg-finoradark-card2 rounded-lg transition text-purple-600 dark:text-finoradark-glow" title="Logar como este usuário">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button onClick={() => abrirModalTaxa(user.id, user.nome, user.planoTaxa?.id)} className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition" title="Atribuir Taxa">
                            <Percent size={18} />
                          </button>
                          <button onClick={() => router.push(`/dashboard/admin/usuarios/${user.id}`)} className="p-2 text-purple-600 dark:text-finoradark-glow hover:bg-purple-50 dark:hover:bg-finoradark-card2 rounded-lg transition" title="Editar usuário">
                            <UserCog size={18} />
                          </button>
                          <button onClick={() => excluirUsuario(user.id, user.nome)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Excluir usuário">
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
          <div className="bg-white dark:bg-finoradark-card rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-finoradark-text mb-4">Atribuir Plano de Taxa</h3>
            <p className="text-gray-600 dark:text-finoradark-textmuted mb-6">Usuário: <span className="font-semibold text-gray-900 dark:text-finoradark-text">{modalTaxa.userName}</span></p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-finoradark-text mb-2">Plano de Taxa</label>
              <select
                value={planoSelecionado}
                onChange={(e) => setPlanoSelecionado(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 dark:text-finoradark-text rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="">Sem plano (taxas padrão)</option>
                {planos.filter(p => p.ativo).map((plano) => (
                  <option key={plano.id} value={plano.id}>{plano.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={atribuirTaxa} className="flex-1 px-6 py-3 bg-purple-600 dark:bg-finoradark-glow text-white rounded-lg font-semibold hover:bg-purple-700 dark:hover:opacity-90 transition">Confirmar</button>
              <button onClick={() => setModalTaxa(null)} className="px-6 py-3 bg-gray-200 dark:bg-finoradark-card2 text-gray-700 dark:text-finoradark-textmuted rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-finoradark-border transition">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}