'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Save, TestTube, ExternalLink } from 'lucide-react';

export default function NotificacoesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [mensagem, setMensagem] = useState<{tipo: 'sucesso' | 'erro', texto: string} | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTelegramBotToken(data.user.telegramBotToken || '');
        setTelegramChatId(data.user.telegramChatId || '');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracoes = async () => {
    setSalvando(true);
    setMensagem(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/update-telegram', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          telegramBotToken,
          telegramChatId
        })
      });

      if (response.ok) {
        setMensagem({ tipo: 'sucesso', texto: '✅ Configurações salvas com sucesso!' });
      } else {
        setMensagem({ tipo: 'erro', texto: '❌ Erro ao salvar configurações' });
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao salvar configurações' });
    } finally {
      setSalvando(false);
    }
  };

  const testarNotificacao = async () => {
    if (!telegramBotToken || !telegramChatId) {
      setMensagem({ tipo: 'erro', texto: '⚠️ Preencha as credenciais antes de testar' });
      return;
    }

    setTestando(true);
    setMensagem(null);

    try {
      const response = await fetch('/api/telegram/testar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramBotToken,
          chatId: telegramChatId
        })
      });

      if (response.ok) {
        setMensagem({ tipo: 'sucesso', texto: '✅ Mensagem de teste enviada! Verifique seu Telegram.' });
      } else {
        const data = await response.json();
        setMensagem({ tipo: 'erro', texto: `❌ Erro: ${data.error || 'Verifique as credenciais'}` });
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao enviar mensagem de teste' });
    } finally {
      setTestando(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-purple-600 text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Bell className="text-purple-600" size={32} />
              <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
            </div>
            <p className="text-gray-600">Configure suas notificações do Telegram para receber alertas de novos pedidos PAD</p>
          </div>

          {/* Mensagem de feedback */}
          {mensagem && (
            <div className={`mb-6 p-4 rounded-lg ${
              mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {mensagem.texto}
            </div>
          )}

          {/* Card de Configuração */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🤖 Configurar Bot do Telegram</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bot Token
                </label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chat ID
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="123456789 ou -1001234567890"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={salvarConfiguracoes}
                  disabled={salvando}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Save size={20} />
                  <span>{salvando ? 'Salvando...' : 'Salvar Configurações'}</span>
                </button>

                <button
                  onClick={testarNotificacao}
                  disabled={testando}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center space-x-2"
                >
                  <TestTube size={20} />
                  <span>{testando ? 'Testando...' : 'Testar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card de Instruções */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">📚 Como configurar:</h3>
            
            <div className="space-y-4 text-sm text-blue-800">
              <div>
                <p className="font-semibold mb-2">1️⃣ Criar Bot no Telegram:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Abra o Telegram e procure por <strong>@BotFather</strong></li>
                  <li>Envie o comando <code className="bg-blue-100 px-2 py-1 rounded">/newbot</code></li>
                  <li>Escolha um nome e username para seu bot</li>
                  <li>Copie o <strong>Token</strong> que aparece</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">2️⃣ Obter Chat ID:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Procure por <strong>@userinfobot</strong> no Telegram</li>
                  <li>Envie qualquer mensagem para ele</li>
                  <li>Copie o número que aparece como <strong>Id</strong></li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">3️⃣ Adicionar credenciais acima e salvar</p>
              </div>

              <div>
                <p className="font-semibold mb-2">4️⃣ Testar a configuração</p>
              </div>

              <div className="pt-4 border-t border-blue-200">
                <p className="font-semibold mb-2">💡 Dica:</p>
                <p>Você pode criar um grupo no Telegram e adicionar o bot para receber notificações em equipe!</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}