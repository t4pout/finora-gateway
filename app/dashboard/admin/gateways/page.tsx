'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { CreditCard, CheckCircle } from 'lucide-react';

interface CurrentUser {
  nome: string;
  role?: string;
}

interface ConfigGateway {
  metodo: string;
  gateway: string;
  ativo: boolean;
}

export default function GatewaysPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [configs, setConfigs] = useState<ConfigGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      if (user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    }
    carregarConfigs();
  }, [router]);

  const carregarConfigs = async () => {
    try {
      const res = await fetch('/api/configuracoes-gateway');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarConfig = async (metodo: string, gateway: string) => {
    setSalvando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/configuracoes-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ metodo, gateway })
      });
      if (res.ok) {
        setSalvo(true);
        setTimeout(() => setSalvo(false), 3000);
        carregarConfigs();
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setSalvando(false);
    }
  };

  const getGatewaysDisponiveis = (metodo: string) => {
    if (metodo === 'PIX') return ['PAGGPIX', 'MERCADOPAGO', 'PICPAY'];
    if (metodo === 'BOLETO') return ['MERCADOPAGO', 'APPMAX'];
    if (metodo === 'CARTAO') return ['MERCADOPAGO', 'PICPAY', 'APPMAX'];
    return [];
  };

  const getNomeGateway = (gateway: string) => {
    const nomes: any = {
      PAGGPIX: 'PaggPix',
      MERCADOPAGO: 'Mercado Pago',
      PICPAY: 'PicPay',
      ASAAS: 'Asaas'
      APPMAX: 'Appmax'
    };
    return nomes[gateway] || gateway;
  };

  const getCorMetodo = (metodo: string) => {
    if (metodo === 'PIX') return 'green';
    if (metodo === 'BOLETO') return 'orange';
    if (metodo === 'CARTAO') return 'blue';
    return 'purple';
  };

  const getIconeMetodo = (metodo: string) => {
    if (metodo === 'PIX') return '🟢';
    if (metodo === 'BOLETO') return '📄';
    if (metodo === 'CARTAO') return '💳';
    return '💰';
  };

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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <CreditCard size={22} className="text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuração de Gateways</h1>
                <p className="text-sm text-gray-500">Defina qual adquirente processa cada método de pagamento</p>
              </div>
            </div>
            {salvo && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">Configuração salva!</span>
              </div>
            )}
          </div>
        </header>

        <div className="p-8 max-w-3xl">

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800">
            ⚠️ <strong>Atenção:</strong> Alterações aqui afetam imediatamente todos os checkouts ativos. Tenha certeza antes de salvar.
          </div>

          <div className="space-y-4">
            {configs.map((config) => {
              const gateways = getGatewaysDisponiveis(config.metodo);
              return (
                <div key={config.metodo} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getIconeMetodo(config.metodo)}</span>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{config.metodo}</div>
                        <div className="text-sm text-gray-500">Gateway atual: <span className="font-semibold text-gray-700">{getNomeGateway(config.gateway)}</span></div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <select
                        defaultValue={config.gateway}
                        onChange={(e) => {
                          const novoGateway = e.target.value;
                          if (novoGateway !== config.gateway) {
                            if (confirm(`Trocar ${config.metodo} para ${getNomeGateway(novoGateway)}?\n\nIsso afeta todos os checkouts imediatamente.`)) {
                              salvarConfig(config.metodo, novoGateway);
                            } else {
                              e.target.value = config.gateway;
                            }
                          }
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 font-medium"
                        disabled={gateways.length <= 1}
                      >
                        {gateways.map(gw => (
                          <option key={gw} value={gw}>{getNomeGateway(gw)}</option>
                        ))}
                      </select>

                      {gateways.length <= 1 && (
                        <span className="text-xs text-gray-400 italic">Único gateway disponível</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-3">📋 Gateways Configurados</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">PaggPix</span>
                <span className="text-gray-900 font-medium">PIX</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Mercado Pago</span>
                <span className="text-gray-900 font-medium">PIX, Boleto, Cartão</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">PicPay</span>
                <span className="text-gray-900 font-medium">PIX, Cartão</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Appmax</span>
                <span className="text-gray-900 font-medium">Cartão, Boleto</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}