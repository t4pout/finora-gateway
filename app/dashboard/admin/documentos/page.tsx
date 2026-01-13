'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, DollarSign, Users, LogOut, ShoppingBag, BarChart3, Zap, Shield, FileText, CheckCircle, XCircle, Eye , Banknote } from 'lucide-react';

interface Documento {
  id: string;
  tipo: string;
  arquivo: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    nome: string;
    email: string;
  };
}

interface User {
  nome: string;
  role?: string;
}

export default function DocumentosAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
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
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      if (user.role !== 'ADMIN') {
        alert('Acesso negado!');
        router.push('/dashboard');
        return;
      }
    }

    carregarDocumentos();
  }, [router]);

  const carregarDocumentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/documentos', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocumentos(data.documentos || []);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const aprovarDocumento = async (id: string, userId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/documentos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ status: 'APROVADO', userId })
      });
      alert('Documento aprovado!');
      carregarDocumentos();
    } catch (error) {
      alert('Erro ao aprovar');
    }
  };

  const rejeitarDocumento = async (id: string) => {
    const motivo = prompt('Motivo da rejeição:');
    if (!motivo) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/documentos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ status: 'REJEITADO', motivoRejeicao: motivo })
      });
      alert('Documento rejeitado!');
      carregarDocumentos();
    } catch (error) {
      alert('Erro ao rejeitar');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const documentosFiltrados = documentos.filter(d => 
    filtro === 'TODOS' ? true : d.status === filtro
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
            <Link href="/dashboard/admin/documentos"><div className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition"><FileText size={20} /><span>Documentos</span></div></Link>
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
              <h1 className="text-2xl font-bold text-gray-900">📄 Verificação de Documentos</h1>
              <p className="text-sm text-gray-500">Aprovar ou rejeitar documentos dos usuários</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setFiltro('PENDENTE')} className={`px-4 py-2 rounded-lg font-semibold transition ${filtro === 'PENDENTE' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Pendentes</button>
              <button onClick={() => setFiltro('APROVADO')} className={`px-4 py-2 rounded-lg font-semibold transition ${filtro === 'APROVADO' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Aprovados</button>
              <button onClick={() => setFiltro('REJEITADO')} className={`px-4 py-2 rounded-lg font-semibold transition ${filtro === 'REJEITADO' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Rejeitados</button>
              <button onClick={() => setFiltro('TODOS')} className={`px-4 py-2 rounded-lg font-semibold transition ${filtro === 'TODOS' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Todos</button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {documentosFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <FileText size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum documento {filtro.toLowerCase()}</h3>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documentosFiltrados.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{doc.user.nome}</h3>
                      <p className="text-sm text-gray-600">{doc.user.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${doc.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' : doc.status === 'APROVADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{doc.status}</span>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600">Tipo de Documento</div>
                    <div className="font-semibold text-gray-900">{doc.tipo}</div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600">Enviado em</div>
                    <div className="font-semibold text-gray-900">{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</div>
                  </div>

                  <a href={doc.arquivo} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition mb-3">
                    <Eye size={16} />
                    <span>Ver Documento</span>
                  </a>

                  {doc.status === 'PENDENTE' && (
                    <div className="flex gap-2">
                      <button onClick={() => aprovarDocumento(doc.id, doc.user.id)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2">
                        <CheckCircle size={16} />
                        <span>Aprovar</span>
                      </button>
                      <button onClick={() => rejeitarDocumento(doc.id)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center space-x-2">
                        <XCircle size={16} />
                        <span>Rejeitar</span>
                      </button>
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
