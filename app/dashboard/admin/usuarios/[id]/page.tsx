'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import { ArrowLeft, Save, User, Mail, Phone, CreditCard, Shield } from 'lucide-react';
import LoadingScreen from '@/app/components/LoadingScreen';

interface CurrentUser {
  nome: string;
  role?: string;
}

export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [finoraUtmAtivo, setFinoraUtmAtivo] = useState(false);
  const [togglingUtm, setTogglingUtm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    role: 'VENDEDOR',
    status: 'ATIVO',
    telegramBotToken: '',
    telegramChatId: '',
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      if (user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    }
    carregarUsuario();
  }, []);

  const carregarUsuario = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        const u = data.user;
        setFormData({
          nome: u.nome || '',
          email: u.email || '',
          telefone: u.telefone || '',
          cpf: u.cpf || '',
          role: u.role || 'VENDEDOR',
          status: u.status || 'ATIVO',
          telegramBotToken: u.telegramBotToken || '',
          telegramChatId: u.telegramChatId || '',
        });
        setFinoraUtmAtivo(u.finoraUtmAtivo === true);
      } else {
        alert('Usuário não encontrado');
        router.push('/dashboard/admin');
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert('✅ Usuário atualizado com sucesso!');
        router.push('/dashboard/admin');
      } else {
        const data = await response.json();
        alert('❌ Erro: ' + (data.error || 'Erro ao salvar'));
      }
    } catch (error) {
      alert('❌ Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };
  
const toggleFinoraUtm = async () => {
    setTogglingUtm(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ finoraUtmAtivo: !finoraUtmAtivo })
      });
      if (response.ok) {
        setFinoraUtmAtivo(!finoraUtmAtivo);
        alert(!finoraUtmAtivo ? 'Finora UTM ativado!' : 'Finora UTM desativado!');
      } else {
        alert('Erro ao alterar');
      }
    } catch (error) {
      alert('Erro ao alterar');
    } finally {
      setTogglingUtm(false);
    }
  };

  const alterarSenha = async () => {
    const novaSenha = prompt('Digite a nova senha (mínimo 6 caracteres):');
    if (!novaSenha) return;
    if (novaSenha.length < 6) { alert('Senha muito curta!'); return; }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/senha`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ senha: novaSenha })
      });
      if (response.ok) { alert('✅ Senha alterada com sucesso!'); }
      else { alert('❌ Erro ao alterar senha'); }
    } catch (error) { alert('❌ Erro ao alterar senha'); }
  };

  if (loading) return <div className="flex h-screen bg-gray-50"><Sidebar user={currentUser} onLogout={handleLogout} /><div className="flex-1 flex items-center justify-center"><LoadingScreen /></div></div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={currentUser} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/admin">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition">
                <ArrowLeft size={20} /><span>Voltar</span>
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Usuário</h1>
              <p className="text-sm text-gray-500">{formData.email}</p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-purple-600" /> Dados Pessoais
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome Completo *</label>
                <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone</label>
                <input type="tel" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">CPF</label>
                <input type="text" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" placeholder="000.000.000-00" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield size={20} className="text-purple-600" /> Configurações da Conta
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900">
                  <option value="VENDEDOR">VENDEDOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900">
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                  <option value="SUSPENSO">SUSPENSO</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              📱 Telegram
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bot Token</label>
                <input type="text" value={formData.telegramBotToken} onChange={e => setFormData({...formData, telegramBotToken: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" placeholder="Token do bot Telegram" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chat ID</label>
                <input type="text" value={formData.telegramChatId} onChange={e => setFormData({...formData, telegramChatId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" placeholder="Chat ID do Telegram" />
              </div>
            </div>
          </div>

  <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              Finora UTM
            </h2>
            <p className="text-sm text-gray-500 mb-6">Ativa o modulo de rastreamento UTM para este usuario. Funcionalidade paga — ative apenas para quem contratou.</p>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900">Status do Finora UTM</div>
                <div className="text-sm text-gray-500">{finoraUtmAtivo ? 'Ativo — usuario tem acesso ao modulo UTM' : 'Inativo — usuario nao ve o modulo UTM'}</div>
              </div>
              <button
                onClick={toggleFinoraUtm}
                disabled={togglingUtm}
                className={'px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 ' + (finoraUtmAtivo ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200')}
              >
                {togglingUtm ? 'Aguarde...' : finoraUtmAtivo ? 'Desativar Finora UTM' : 'Ativar Finora UTM'}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={salvar} disabled={salvando}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={18} />
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button onClick={alterarSenha}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition">
              🔑 Alterar Senha
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}