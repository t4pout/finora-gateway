'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Save, TestTube, ExternalLink, Smartphone } from 'lucide-react';
import LoadingScreen from '@/app/components/LoadingScreen';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificacoesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [mensagem, setMensagem] = useState<{tipo: 'sucesso' | 'erro', texto: string} | null>(null);

  const [pushSuportado, setPushSuportado] = useState(false);
  const [pushAtivo, setPushAtivo] = useState(false);
  const [pushCarregando, setPushCarregando] = useState(false);
  const [pushTestando, setPushTestando] = useState(false);

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
    verificarSuportePush();
  }, []);

  const verificarSuportePush = async () => {
    const suportado = 'serviceWorker' in navigator && 'PushManager' in window;
    setPushSuportado(suportado);
    if (!suportado) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.getSubscription();
      setPushAtivo(!!subscription);
    } catch (e) {
      console.error('Erro ao verificar service worker:', e);
    }
  };

  const ativarPush = async () => {
    setPushCarregando(true);
    setMensagem(null);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== 'granted') {
        setMensagem({ tipo: 'erro', texto: '⚠️ Permissão de notificação negada. Ative nas configurações do navegador.' });
        setPushCarregando(false);
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const token = localStorage.getItem('token');
      const subJson = subscription.toJSON();
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys })
      });

      if (res.ok) {
        setPushAtivo(true);
        setMensagem({ tipo: 'sucesso', texto: '✅ Notificações push ativadas com sucesso!' });
      } else {
        setMensagem({ tipo: 'erro', texto: '❌ Erro ao salvar inscrição no servidor' });
      }
    } catch (e) {
      console.error('Erro ao ativar push:', e);
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao ativar notificações push' });
    } finally {
      setPushCarregando(false);
    }
  };

  const desativarPush = async () => {
    setPushCarregando(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const token = localStorage.getItem('token');
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        await subscription.unsubscribe();
      }
      setPushAtivo(false);
      setMensagem({ tipo: 'sucesso', texto: '🔕 Notificações push desativadas' });
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao desativar' });
    } finally {
      setPushCarregando(false);
    }
  };

  const testarPush = async () => {
    setPushTestando(true);
    setMensagem(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/push/testar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: '✅ Notificação de teste enviada! Verifique seu celular.' });
      } else {
        setMensagem({ tipo: 'erro', texto: '❌ Erro ao enviar notificação de teste' });
      }
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao enviar teste' });
    } finally {
      setPushTestando(false);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-finoradark-bg">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-finoradark-bg flex">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Bell className="text-purple-600 dark:text-finoradark-glow" size={32} />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-finoradark-text">Notificações</h1>
            </div>
            <p className="text-gray-600 dark:text-finoradark-textmuted">Configure como você quer ser avisado de novas vendas</p>
          </div>

          {/* Mensagem de feedback */}
          {mensagem && (
            <div className={`mb-6 p-4 rounded-lg ${
              mensagem.tipo === 'sucesso' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-900/40' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/40'
            }`}>
              {mensagem.texto}
            </div>
          )}

          {/* Card de Notificações Push */}
          <div className="bg-white dark:bg-finoradark-card rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-finoradark-border p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="text-purple-600 dark:text-finoradark-glow" size={22} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-finoradark-text">Notificações Push da Finora</h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 dark:bg-finoradark-card2 text-purple-700 dark:text-finoradark-glow rounded-full">Novo</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-finoradark-textmuted mb-5">Receba notificações de vendas diretamente no seu celular, com a marca da Finora — sem precisar de Telegram.</p>

            {!pushSuportado ? (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/40 rounded-lg text-sm text-yellow-800 dark:text-yellow-400">
                ⚠️ Seu navegador não suporta notificações push, ou você está em uma aba anônima/privada. No iPhone, adicione o site à tela inicial primeiro (Safari → Compartilhar → Adicionar à Tela de Início).
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {!pushAtivo ? (
                  <button
                    onClick={ativarPush}
                    disabled={pushCarregando}
                    className="px-6 py-3 bg-purple-600 dark:bg-finoradark-glow text-white rounded-lg font-semibold hover:bg-purple-700 dark:hover:opacity-90 transition disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Bell size={20} />
                    <span>{pushCarregando ? 'Ativando...' : 'Ativar Notificações'}</span>
                  </button>
                ) : (
                  <>
                    <span className="px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg font-semibold flex items-center gap-2">
                      ✅ Ativado neste dispositivo
                    </span>
                    <button
                      onClick={testarPush}
                      disabled={pushTestando}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center space-x-2"
                    >
                      <TestTube size={20} />
                      <span>{pushTestando ? 'Enviando...' : 'Testar'}</span>
                    </button>
                    <button
                      onClick={desativarPush}
                      disabled={pushCarregando}
                      className="px-6 py-3 border-2 border-gray-300 dark:border-finoradark-border text-gray-700 dark:text-finoradark-textmuted rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-finoradark-card2 transition disabled:opacity-50"
                    >
                      Desativar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Card de Configuração Telegram */}
          <div className="bg-white dark:bg-finoradark-card rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-finoradark-border p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-finoradark-text mb-4">🤖 Configurar Bot do Telegram</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">
                  Bot Token
                </label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 dark:text-finoradark-text rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">
                  Chat ID
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="123456789 ou -1001234567890"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 dark:text-finoradark-text rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={salvarConfiguracoes}
                  disabled={salvando}
                  className="flex-1 px-6 py-3 bg-purple-600 dark:bg-finoradark-glow text-white rounded-lg font-semibold hover:bg-purple-700 dark:hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center space-x-2"
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
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/40 p-6">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-400 mb-4">📚 Como configurar o Telegram:</h3>
            
            <div className="space-y-4 text-sm text-blue-800 dark:text-blue-300">
              <div>
                <p className="font-semibold mb-2">1️⃣ Criar Bot no Telegram:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Abra o Telegram e procure por <strong>@BotFather</strong></li>
                  <li>Envie o comando <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">/newbot</code></li>
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

              <div className="pt-4 border-t border-blue-200 dark:border-blue-900/40">
                <p className="font-semibold mb-2">💡 Dica:</p>
                <p>Você pode ativar o Telegram e as Notificações Push ao mesmo tempo — ambos funcionam juntos, sem conflito.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}