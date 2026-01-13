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
  Link2,
  Copy,
  MousePointer,
  TrendingUp,
  Plus
, Zap, BarChart3 , Shield , Wallet , ChevronDown } from 'lucide-react';

interface Afiliacao {
  id: string;
  codigo: string;
  comissao: number;
  cliques: number;
  conversoes: number;
  status: string;
  createdAt: string;
}

interface User {
  nome: string;
}

export default function AfiliadosPage() {
  const router = useRouter();
  const [afiliacoes, setAfiliacoes] = useState<Afiliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendasOpen, setVendasOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [criando, setCriando] = useState(false);
  const [comissao, setComissao] = useState('30');

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

    carregarAfiliacoes();
  }, [router]);

  const carregarAfiliacoes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/afiliados', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        setAfiliacoes(data.afiliacoes || []);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarLinkAfiliado = async () => {
    setCriando(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/afiliados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ comissao: parseFloat(comissao) })
      });

      if (response.ok) {
        alert('Link de afiliado criado!');
        carregarAfiliacoes();
      }
    } catch (error) {
      alert('Erro ao criar link');
    } finally {
      setCriando(false);
    }
  };

  const copiarLink = (codigo: string) => {
    const link = `${window.location.origin}/?ref=${codigo}`;
    navigator.clipboard.writeText(link);
    alert('Link copiado!');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const totalCliques = afiliacoes.reduce((acc, a) => acc + a.cliques, 0);
  const totalConversoes = afiliacoes.reduce((acc, a) => acc + a.conversoes, 0);
  const taxaConversao = totalCliques > 0 ? ((totalConversoes / totalCliques) * 100).toFixed(1) : 0;

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Afiliados</h1>
            <p className="text-sm text-gray-500">Gerencie seus links de afiliados</p>
          </div>
        </header>

        <div className="p-8">
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Links Ativos</div>
                <Link2 size={20} className="text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600">{afiliacoes.length}</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Total de Cliques</div>
                <MousePointer size={20} className="text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-600">{totalCliques}</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Conversões</div>
                <ShoppingBag size={20} className="text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600">{totalConversoes}</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Taxa de Conversão</div>
                <TrendingUp size={20} className="text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-600">{taxaConversao}%</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Criar Novo Link de Afiliado</h2>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Comissão (%)
                </label>
                <input
                  type="number"
                  value={comissao}
                  onChange={(e) => setComissao(e.target.value)}
                  step="0.1"
                  className="w-full px-4 py-3 border text-gray-900"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={criarLinkAfiliado}
                  disabled={criando}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center space-x-2"
                >
                  <Plus size={20} />
                  <span>{criando ? 'Criando...' : 'Criar Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {afiliacoes.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <Link2 size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum link criado</h3>
              <p className="text-gray-600">Crie seu primeiro link de afiliado!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {afiliacoes.map((afiliacao) => (
                <div key={afiliacao.id} className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 mb-1">Link de Afiliado</div>
                      <div className="flex items-center gap-2">
                        <code className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm flex-1 font-mono">
                          {window.location.origin}/?ref={afiliacao.codigo}
                        </code>
                        <button
                          onClick={() => copiarLink(afiliacao.codigo)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center space-x-2"
                        >
                          <Copy size={16} />
                          <span>Copiar</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Comissão</div>
                      <div className="text-xl font-bold text-purple-600">{afiliacao.comissao}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Cliques</div>
                      <div className="text-xl font-bold text-gray-900">{afiliacao.cliques}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Conversões</div>
                      <div className="text-xl font-bold text-green-600">{afiliacao.conversoes}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Status</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        afiliacao.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {afiliacao.status}
                      </span>
                    </div>
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
