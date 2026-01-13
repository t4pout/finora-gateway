'use client';

import Sidebar from '@/app/components/Sidebar';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, DollarSign, Users, LogOut, ShoppingBag, BarChart3, Zap, Wallet, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Solicitacao {
  id: string;
  status: string;
  mensagem: string;
  motivoRejeicao: string | null;
  createdAt: string;
  afiliado: {
    id: string;
    nome: string;
    email: string;
  };
  produto: {
    id: string;
    nome: string;
  };
}

interface User {
  nome: string;
  role?: string;
}

export default function SolicitacoesAfiliacaoPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('PENDENTE');

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

    carregarSolicitacoes();
  }, [router]);

  const carregarSolicitacoes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/solicitacoes-afiliacao', {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (response.ok) {
        const data = await response.json();
        setSolicitacoes(data.solicitacoes || []);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const aprovarSolicitacao = async (id: string) => {
    if (!confirm('Aprovar esta solicitação?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/solicitacoes-afiliacao/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ status: 'APROVADO' })
      });

      if (response.ok) {
        alert('Solicitação aprovada!');
        carregarSolicitacoes();
      } else {
        alert('Erro ao aprovar');
      }
    } catch (error) {
      alert('Erro ao aprovar');
    }
  };

  const rejeitarSolicitacao = async (id: string) => {
    const motivo = prompt('Motivo da rejeição:');
    if (!motivo) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/solicitacoes-afiliacao/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ 
          status: 'REJEITADO',
          motivoRejeicao: motivo
        })
      });

      if (response.ok) {
        alert('Solicitação rejeitada');
        carregarSolicitacoes();
      } else {
        alert('Erro ao rejeitar');
      }
    } catch (error) {
      alert('Erro ao rejeitar');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const solicitacoesFiltradas = solicitacoes.filter(s => 
    filtro === 'TODAS' ? true : s.status === filtro
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
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🤝 Solicitações de Afiliação</h1>
              <p className="text-sm text-gray-500">Aprove ou rejeite solicitações</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex gap-2">
              <button onClick={() => setFiltro('PENDENTE')} className={`px-4 py-2 rounded-lg font-semibold transition ${filtro === 'PENDENTE' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Pendentes</button>
              <button onClick={() => setFiltro('APROVADO')} className={`px-4 py-2 rounded-lg font-semibold transition ${filtro === 'APROVADO' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Aprovadas</button>
              <button onClick={() => setFiltro('REJEITADO')} className={`px-4 py-2 rounded-lg font-semibold transition ${filtro === 'REJEITADO' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Rejeitadas</button>
              <button onClick={() => setFiltro('TODAS')} className={`px-4 py-2 rounded-lg font-semibold transition ${filtro === 'TODAS' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Todas</button>
            </div>
          </div>

          {solicitacoesFiltradas.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <Clock size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma solicitação</h3>
              <p className="text-gray-600">Não há solicitações {filtro.toLowerCase()}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {solicitacoesFiltradas.map((sol) => (
                <div key={sol.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{sol.afiliado.nome}</h3>
                      <p className="text-sm text-gray-600">{sol.afiliado.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      sol.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' :
                      sol.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>{sol.status}</span>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600">Produto</div>
                    <div className="font-semibold text-gray-900">{sol.produto.nome}</div>
                  </div>

                  {sol.mensagem && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-semibold text-gray-900 mb-1">Mensagem</div>
                      <div className="text-sm text-gray-600">{sol.mensagem}</div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    {new Date(sol.createdAt).toLocaleDateString('pt-BR')}
                  </div>

                  {sol.status === 'PENDENTE' && (
                    <div className="flex gap-2">
                      <button onClick={() => aprovarSolicitacao(sol.id)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2">
                        <CheckCircle size={16} />
                        <span>Aprovar</span>
                      </button>
                      <button onClick={() => rejeitarSolicitacao(sol.id)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center space-x-2">
                        <XCircle size={16} />
                        <span>Rejeitar</span>
                      </button>
                    </div>
                  )}

                  {sol.status === 'REJEITADO' && sol.motivoRejeicao && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-xs font-semibold text-red-900 mb-1">Motivo</div>
                      <div className="text-sm text-red-700">{sol.motivoRejeicao}</div>
                    </div>
                  )}

                  {sol.status === 'APROVADO' && (
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <div className="text-sm font-semibold text-green-700">✓ Aprovado</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
