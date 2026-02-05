'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, DollarSign, Users, LogOut, ShoppingBag, BarChart3, Zap, Shield, FileText, Percent, Plus, Edit, Trash2, X , Banknote } from 'lucide-react';

interface PlanoTaxa {
  id: string;
  nome: string;
  descricao: string;
  pixPercentual: number;
  pixFixo: number;
  cartaoPercentual: number;
  cartaoFixo: number;
  boletoPercentual: number;
  boletoFixo: number;
  ativo: boolean;
  _count: {
    users: number;
  };
}

interface User {
  nome: string;
  role?: string;
}

export default function TaxasAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [planos, setPlanos] = useState<PlanoTaxa[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState<PlanoTaxa | null>(null);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    pixPercentual: '0',
    pixFixo: '0',
    cartaoPercentual: '0',
    cartaoFixo: '0',
    boletoPercentual: '0',
    boletoFixo: '0',
    prazoPixDias: '3',
    prazoCartaoDias: '30',
    prazoBoletoDias: '7'
  });

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

    carregarPlanos();
  }, [router]);

  const carregarPlanos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/taxas', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlanos(data.planos || []);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (plano?: PlanoTaxa) => {
    if (plano) {
      setEditando(plano);
      setForm({
        nome: plano.nome,
        descricao: plano.descricao || '',
        pixPercentual: plano.pixPercentual.toString(),
        pixFixo: plano.pixFixo.toString(),
        cartaoPercentual: plano.cartaoPercentual.toString(),
        cartaoFixo: plano.cartaoFixo.toString(),
        boletoPercentual: plano.boletoPercentual.toString(),
        boletoFixo: plano.boletoFixo.toString(),
        prazoPixDias: plano.prazoPixDias?.toString() || '3',
        prazoCartaoDias: plano.prazoCartaoDias?.toString() || '30',
        prazoBoletoDias: plano.prazoBoletoDias?.toString() || '7'
      });
    } else {
      setEditando(null);
      setForm({
        nome: '',
        descricao: '',
        pixPercentual: '0',
        pixFixo: '0',
        cartaoPercentual: '0',
        cartaoFixo: '0',
        boletoPercentual: '0',
        boletoFixo: '0',
    prazoPixDias: '3',
    prazoCartaoDias: '30',
    prazoBoletoDias: '7'
      });
    }
    setMostrarModal(true);
  };

  const handleSalvar = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editando 
        ? `/api/admin/taxas/${editando.id}` 
        : '/api/admin/taxas';
      
      const response = await fetch(url, {
        method: editando ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        alert(editando ? 'Plano atualizado!' : 'Plano criado!');
        setMostrarModal(false);
        carregarPlanos();
      }
    } catch (error) {
      alert('Erro ao salvar plano');
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir este plano de taxas?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/taxas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      alert('Plano excluído!');
      carregarPlanos();
    } catch (error) {
      alert('Erro ao excluir');
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
            <Link href="/dashboard/admin/documentos"><div className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition mb-2"><FileText size={20} /><span>Documentos</span></div></Link>
            <Link href="/dashboard/admin/taxas"><div className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"><Percent size={20} /><span>Taxas</span></div></Link>
            <Link href="/dashboard/admin/saques"><div className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"><Banknote size={20} /><span>Saques</span></div></Link>
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
              <h1 className="text-2xl font-bold text-gray-900">💰 Gerenciar Taxas</h1>
              <p className="text-sm text-gray-500">Crie e gerencie planos de taxas para os vendedores</p>
            </div>
            <button onClick={() => abrirModal()} className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center space-x-2">
              <Plus size={20} />
              <span>Novo Plano</span>
            </button>
          </div>
        </header>

        <div className="p-8">
          {planos.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <Percent size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum plano cadastrado</h3>
              <p className="text-gray-600 mb-6">Crie seu primeiro plano de taxas</p>
              <button onClick={() => abrirModal()} className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">Criar Plano</button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {planos.map((plano) => (
                <div key={plano.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plano.nome}</h3>
                      {plano.descricao && <p className="text-sm text-gray-600 mt-1">{plano.descricao}</p>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${plano.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {plano.ativo ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs font-semibold text-blue-900 mb-1">PIX</div>
                      <div className="text-sm text-blue-700">
                        {plano.pixPercentual}% {plano.pixFixo > 0 && `+ R$ ${plano.pixFixo.toFixed(2)}`}
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-xs font-semibold text-purple-900 mb-1">CARTàO</div>
                      <div className="text-sm text-purple-700">
                        {plano.cartaoPercentual}% {plano.cartaoFixo > 0 && `+ R$ ${plano.cartaoFixo.toFixed(2)}`}
                      </div>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-xs font-semibold text-orange-900 mb-1">BOLETO</div>
                      <div className="text-sm text-orange-700">
                        {plano.boletoPercentual}% {plano.boletoFixo > 0 && `+ R$ ${plano.boletoFixo.toFixed(2)}`}
                      </div>

                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-semibold text-gray-900 mb-2">PRAZOS DE LIBERAÇàO</div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
                        <div>PIX: {plano.prazoPixDias || 3}d</div>
                        <div>Cartão: {plano.prazoCartaoDias || 30}d</div>
                        <div>Boleto: {plano.prazoBoletoDias || 7}d</div>
                      </div>
                    </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 mb-4">
                    <div className="text-sm text-gray-600">Usuários com este plano</div>
                    <div className="text-lg font-bold text-purple-600">{plano._count.users}</div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => abrirModal(plano)} className="flex-1 px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition flex items-center justify-center space-x-2">
                      <Edit size={16} />
                      <span>Editar</span>
                    </button>
                    <button onClick={() => handleExcluir(plano.id)} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{editando ? 'Editar Plano' : 'Novo Plano'}</h3>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Nome do Plano *</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} placeholder="Ex: Plano Básico" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Descrição</label>
                <textarea value={form.descricao} onChange={(e) => setForm({...form, descricao: e.target.value})} placeholder="Descrição opcional" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" rows={2}></textarea>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">💳 Taxas PIX</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Percentual (%)</label>
                    <input type="number" step="0.01" value={form.pixPercentual} onChange={(e) => setForm({...form, pixPercentual: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Valor Fixo (R$)</label>
                    <input type="number" step="0.01" value={form.pixFixo} onChange={(e) => setForm({...form, pixFixo: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">💳 Taxas Cartão</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Percentual (%)</label>
                    <input type="number" step="0.01" value={form.cartaoPercentual} onChange={(e) => setForm({...form, cartaoPercentual: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Valor Fixo (R$)</label>
                    <input type="number" step="0.01" value={form.cartaoFixo} onChange={(e) => setForm({...form, cartaoFixo: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">🧾 Taxas Boleto</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Percentual (%)</label>
                    <input type="number" step="0.01" value={form.boletoPercentual} onChange={(e) => setForm({...form, boletoPercentual: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Valor Fixo (R$)</label>
                    <input type="number" step="0.01" value={form.boletoFixo} onChange={(e) => setForm({...form, boletoFixo: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">⏰ Prazos de Liberação (dias)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">PIX</label>
                    <input type="number" min="0" value={form.prazoPixDias} onChange={(e) => setForm({...form, prazoPixDias: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Cartão</label>
                    <input type="number" min="0" value={form.prazoCartaoDias} onChange={(e) => setForm({...form, prazoCartaoDias: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Boleto</label>
                    <input type="number" min="0" value={form.prazoBoletoDias} onChange={(e) => setForm({...form, prazoBoletoDias: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>
                </div>
              </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleSalvar} className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">Salvar</button>
                <button onClick={() => setMostrarModal(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
