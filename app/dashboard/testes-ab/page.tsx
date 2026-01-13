'use client';

import Sidebar from '@/app/components/Sidebar';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, DollarSign, Users, LogOut, ShoppingBag, BarChart3, TrendingUp, Eye, MousePointer, ShoppingCart, Clock, Trophy, Zap , Shield , Wallet , ChevronDown } from 'lucide-react';

interface Metricas {
  visualizacoes: number;
  cliques: number;
  conversoes: number;
  vendasAprovadas: number;
  vendasPendentes: number;
  receita: number;
  taxaConversao: number;
}

interface TesteAB {
  campanha: {
    id: string;
    nome: string;
    produto: string;
    distribuicao: number;
  };
  paginaA: {
    nome: string;
    link: string;
    metricas: Metricas;
  };
  paginaB: {
    nome: string;
    link: string;
    metricas: Metricas;
  };
  vencedor: string;
  diferenca: string;
}

interface User {
  nome: string;
}

export default function TestesABPage() {
  const router = useRouter();
  const [vendasOpen, setVendasOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('7');
  const [testes, setTestes] = useState<TesteAB[]>([]);

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

    carregarTestes();
  }, [router, periodo]);

  const carregarTestes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/testes-ab?periodo=${periodo}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        setTestes(data.testes || []);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🧪 Testes A/B</h1>
              <p className="text-sm text-gray-500">Compare performance das suas páginas</p>
            </div>

            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
            >
              <option value="hoje">Hoje</option>
              <option value="ontem">Ontem</option>
              <option value="7">Últimos 7 dias</option>
              <option value="14">Últimos 14 dias</option>
              <option value="30">Últimos 30 dias</option>
            </select>
          </div>
        </header>

        <div className="p-8">
          {testes.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <Zap size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Nenhum teste A/B ativo
              </h3>
              <p className="text-gray-600 mb-6">
                Crie uma campanha com teste A/B ativado para começar!
              </p>
              <Link href="/dashboard/produtos">
                <button className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                  Ver Produtos
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {testes.map((teste) => (
                <div key={teste.campanha.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-8 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">{teste.campanha.nome}</h3>
                        <p className="text-purple-100 text-sm">Produto: {teste.campanha.produto}</p>
                      </div>
                      {teste.vencedor && (
                        <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
                          <Trophy size={20} className="text-yellow-300" />
                          <span className="text-white font-semibold">
                            Página {teste.vencedor} vencendo ({teste.diferenca}% melhor)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* PÁGINA A */}
                      <div className={`p-6 rounded-xl border-2 ${teste.vencedor === 'A' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">{teste.paginaA.nome}</h4>
                            <p className="text-sm text-gray-500">{teste.campanha.distribuicao}% do tráfego</p>
                          </div>
                          {teste.vencedor === 'A' && (
                            <Trophy size={24} className="text-purple-600" />
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Eye size={16} className="text-blue-600" />
                              <span className="text-sm text-gray-600">Visualizações</span>
                            </div>
                            <span className="font-bold text-gray-900">{teste.paginaA.metricas.visualizacoes}</span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                              <MousePointer size={16} className="text-purple-600" />
                              <span className="text-sm text-gray-600">Cliques</span>
                            </div>
                            <span className="font-bold text-gray-900">{teste.paginaA.metricas.cliques}</span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                              <ShoppingCart size={16} className="text-green-600" />
                              <span className="text-sm text-gray-600">Conversões</span>
                            </div>
                            <span className="font-bold text-green-600">{teste.paginaA.metricas.conversoes}</span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                              <DollarSign size={16} className="text-emerald-600" />
                              <span className="text-sm text-gray-600">Vendas Aprovadas</span>
                            </div>
                            <span className="font-bold text-emerald-600">{teste.paginaA.metricas.vendasAprovadas}</span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Clock size={16} className="text-orange-600" />
                              <span className="text-sm text-gray-600">Vendas Pendentes</span>
                            </div>
                            <span className="font-bold text-orange-600">{teste.paginaA.metricas.vendasPendentes}</span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-purple-100 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <TrendingUp size={16} className="text-purple-600" />
                              <span className="text-sm font-semibold text-purple-900">Taxa Conversão</span>
                            </div>
                            <span className="font-bold text-purple-600 text-lg">{teste.paginaA.metricas.taxaConversao.toFixed(2)}%</span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                            <span className="text-sm font-semibold text-white">Receita Total</span>
                            <span className="font-bold text-green-400 text-lg">R$ {teste.paginaA.metricas.receita.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      </div>

                      {/* PÁGINA B */}
                      <div className={`p-6 rounded-xl border-2 ${teste.vencedor === 'B' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">{teste.paginaB.nome}</h4>
                            <p className="text-sm text-gray-500">{100 - teste.campanha.distribuicao}% do tráfego</p>
                          </div>
                          {teste.vencedor === 'B' && (
                            <Trophy size={24} className="text-blue-600" />
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Eye size={16} className="text-blue-600" />
                              <span className="text-sm text-gray-600">Visualizações</span>
                            </div>
                            <span className="font-bold text-gray-900">{teste.paginaB.metricas.visualizacoes}</span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                              <MousePointer size={16} className="text-purple-600" />
                              <span className="text-sm text-gray-600">Cliques</span>
                            </div>
                            <span className="font-bold text-gray-900">{teste.paginaB.metricas.cliques}</span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                              <ShoppingCart size={16} className="text-green-600" />
                              <span className="text-sm text-gray-600">Conversões</span>
                            </div>
                            <span className="font-bold text-green-600">{teste.paginaB.metricas.conversoes}</span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                              <DollarSign size={16} className="text-emerald-600" />
                              <span className="text-sm text-gray-600">Vendas Aprovadas</span>
                            </div>
                            <span className="font-bold text-emerald-600">{teste.paginaB.metricas.vendasAprovadas}</span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Clock size={16} className="text-orange-600" />
                              <span className="text-sm text-gray-600">Vendas Pendentes</span>
                            </div>
                            <span className="font-bold text-orange-600">{teste.paginaB.metricas.vendasPendentes}</span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <TrendingUp size={16} className="text-blue-600" />
                              <span className="text-sm font-semibold text-blue-900">Taxa Conversão</span>
                            </div>
                            <span className="font-bold text-blue-600 text-lg">{teste.paginaB.metricas.taxaConversao.toFixed(2)}%</span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                            <span className="text-sm font-semibold text-white">Receita Total</span>
                            <span className="font-bold text-green-400 text-lg">R$ {teste.paginaB.metricas.receita.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      </div>
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
