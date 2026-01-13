'use client';

import Sidebar from '@/app/components/Sidebar';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, DollarSign, Users, LogOut, ShoppingBag, BarChart3, Zap, Wallet, Plus, TrendingUp, Clock, Calendar, CreditCard, Banknote, Shield , ChevronDown } from 'lucide-react';

interface Transacao {
  id: string;
  tipo: string;
  valor: number;
  status: string;
  descricao: string;
  dataLiberacao: string | null;
  createdAt: string;
}

interface ContaBancaria {
  id: string;
  tipo: string;
  banco: string;
  agencia: string;
  conta: string;
  chavePix: string;
  titular: string;
  principal: boolean;
}

interface Saque {
  id: string;
  valor: number;
  status: string;
  createdAt: string;
  dataAprovacao: string | null;
  contaBancaria: ContaBancaria;
}

interface User {
  nome: string;
  role?: string;
}

export default function CarteiraPage() {
  const router = useRouter();
  const [vendasOpen, setVendasOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saldoLiberado, setSaldoLiberado] = useState(0);
  const [saldoPendente, setSaldoPendente] = useState(0);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [saques, setSaques] = useState<Saque[]>([]);
  const [mostrarModalSaque, setMostrarModalSaque] = useState(false);
  const [mostrarModalConta, setMostrarModalConta] = useState(false);
  const [valorSaque, setValorSaque] = useState('');
  const [contaSelecionada, setContaSelecionada] = useState('');
  const [abaSelecionada, setAbaSelecionada] = useState('transacoes');
  const [formConta, setFormConta] = useState({
    tipo: 'PIX',
    banco: '',
    agencia: '',
    conta: '',
    tipoConta: 'CORRENTE',
    chavePix: '',
    tipoChavePix: 'CPF',
    titular: '',
    cpfCnpj: '',
    principal: false
  });

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

    carregarDados();
  }, [router]);

  const carregarDados = async () => {
    const token = localStorage.getItem('token');
    
    // Carteira
    try {
      const res = await fetch('/api/carteira', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setSaldoLiberado(data.saldoLiberado);
        setSaldoPendente(data.saldoPendente);
        setTransacoes(data.transacoes || []);
      }
    } catch (e) { console.error(e); }

    // Contas
    try {
      const res = await fetch('/api/contas-bancarias', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setContas(data.contas || []);
      }
    } catch (e) { console.error(e); }

    // Saques
    try {
      const res = await fetch('/api/saques', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setSaques(data.saques || []);
      }
    } catch (e) { console.error(e); }

    setLoading(false);
  };

  const handleSolicitarSaque = async () => {
    if (!valorSaque || !contaSelecionada) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/saques', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          valor: parseFloat(valorSaque),
          contaBancariaId: contaSelecionada
        })
      });

      if (res.ok) {
        alert('Saque solicitado! Será aprovado em até 48h úteis.');
        setMostrarModalSaque(false);
        setValorSaque('');
        carregarDados();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao solicitar saque');
      }
    } catch (e) {
      alert('Erro ao solicitar saque');
    }
  };

  const handleAdicionarConta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/contas-bancarias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(formConta)
      });
      alert('Conta adicionada!');
      setMostrarModalConta(false);
      carregarDados();
    } catch (e) {
      alert('Erro');
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
              <h1 className="text-2xl font-bold text-gray-900">💰 Minha Carteira</h1>
              <p className="text-sm text-gray-500">Gerencie seus saldos e saques</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium opacity-90">Saldo Liberado</div>
                <TrendingUp size={24} />
              </div>
              <div className="text-4xl font-bold mb-1">R$ {saldoLiberado.toFixed(2).replace('.', ',')}</div>
              <button onClick={() => setMostrarModalSaque(true)} className="mt-4 w-full px-4 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition">Solicitar Saque</button>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium opacity-90">Saldo Pendente</div>
                <Clock size={24} />
              </div>
              <div className="text-4xl font-bold">R$ {saldoPendente.toFixed(2).replace('.', ',')}</div>
              <div className="text-xs opacity-90 mt-2">Aguardando liberação</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium opacity-90">Total de Saques</div>
                <Banknote size={24} />
              </div>
              <div className="text-4xl font-bold">{saques.length}</div>
              <div className="text-xs opacity-90 mt-2">{saques.filter(s => s.status === 'PENDENTE').length} pendentes</div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
            <div className="flex items-start space-x-3">
              <Clock size={20} className="text-yellow-600 mt-0.5" />
              <div>
                <div className="font-semibold text-yellow-900 mb-1">⏰ Prazo de Aprovação</div>
                <div className="text-sm text-yellow-700">Saques são aprovados em até 48 horas úteis após a solicitação.</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button onClick={() => setAbaSelecionada('transacoes')} className={`flex-1 px-6 py-4 font-semibold transition ${abaSelecionada === 'transacoes' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-900'}`}>Transações</button>
                <button onClick={() => setAbaSelecionada('saques')} className={`flex-1 px-6 py-4 font-semibold transition ${abaSelecionada === 'saques' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-900'}`}>Saques</button>
                <button onClick={() => setAbaSelecionada('contas')} className={`flex-1 px-6 py-4 font-semibold transition ${abaSelecionada === 'contas' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-900'}`}>Contas Bancárias</button>
              </div>
            </div>

            <div className="p-6">
              {abaSelecionada === 'transacoes' && (
                <div>
                  {transacoes.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600">Nenhuma transação ainda</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Data</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Descrição</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Valor</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Liberação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transacoes.map((t) => (
                            <tr key={t.id} className="border-b border-gray-100">
                              <td className="py-4 px-4 text-sm text-gray-600">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</td>
                              <td className="py-4 px-4 text-sm text-gray-900">{t.descricao || 'Venda'}</td>
                              <td className="py-4 px-4 text-sm font-semibold text-green-600">R$ {t.valor.toFixed(2).replace('.', ',')}</td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${t.status === 'LIBERADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">{t.dataLiberacao ? new Date(t.dataLiberacao).toLocaleDateString('pt-BR') : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {abaSelecionada === 'saques' && (
                <div>
                  {saques.length === 0 ? (
                    <div className="text-center py-12">
                      <Banknote size={64} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600">Nenhum saque solicitado</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {saques.map((s) => (
                        <div key={s.id} className="p-6 border border-gray-200 rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="text-2xl font-bold text-gray-900">R$ {s.valor.toFixed(2).replace('.', ',')}</div>
                              <div className="text-sm text-gray-600">{new Date(s.createdAt).toLocaleDateString('pt-BR')}</div>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                              s.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' :
                              s.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>{s.status}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>Conta: {s.contaBancaria.tipo === 'PIX' ? s.contaBancaria.chavePix : `${s.contaBancaria.banco} - Ag: ${s.contaBancaria.agencia} - Conta: ${s.contaBancaria.conta}`}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {abaSelecionada === 'contas' && (
                <div>
                  <div className="mb-6">
                    <button onClick={() => setMostrarModalConta(true)} className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center space-x-2">
                      <Plus size={20} />
                      <span>Nova Conta</span>
                    </button>
                  </div>
                  {contas.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard size={64} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600">Nenhuma conta cadastrada</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {contas.map((c) => (
                        <div key={c.id} className={`p-6 border-2 rounded-xl ${c.principal ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                          {c.principal && <div className="text-xs font-semibold text-purple-600 mb-2">PRINCIPAL</div>}
                          <div className="font-bold text-gray-900 mb-2">{c.titular}</div>
                          {c.tipo === 'PIX' ? (
                            <div className="text-sm text-gray-600">PIX: {c.chavePix}</div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              <div>{c.banco}</div>
                              <div>Ag: {c.agencia} | Conta: {c.conta}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {mostrarModalSaque && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Solicitar Saque</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Valor</label>
              <input type="number" step="0.01" value={valorSaque} onChange={(e) => setValorSaque(e.target.value)} placeholder="0,00" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
              <div className="text-xs text-gray-500 mt-1">Disponível: R$ {saldoLiberado.toFixed(2).replace('.', ',')}</div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Conta para Recebimento</label>
              <select value={contaSelecionada} onChange={(e) => setContaSelecionada(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none">
                <option value="">Selecione uma conta</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tipo === 'PIX' ? `PIX: ${c.chavePix}` : `${c.banco} - ${c.conta}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSolicitarSaque} className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">Confirmar</button>
              <button onClick={() => setMostrarModalSaque(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalConta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Nova Conta Bancária</h3>
            <form onSubmit={handleAdicionarConta} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo</label>
                <select value={formConta.tipo} onChange={(e) => setFormConta({...formConta, tipo: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none">
                  <option value="PIX">PIX</option>
                  <option value="CONTA">Conta Bancária</option>
                </select>
              </div>

              {formConta.tipo === 'PIX' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo de Chave</label>
                    <select value={formConta.tipoChavePix} onChange={(e) => setFormConta({...formConta, tipoChavePix: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none">
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="TELEFONE">Telefone</option>
                      <option value="ALEATORIA">Aleatória</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Chave PIX</label>
                    <input type="text" value={formConta.chavePix} onChange={(e) => setFormConta({...formConta, chavePix: e.target.value})} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Banco</label>
                      <input type="text" value={formConta.banco} onChange={(e) => setFormConta({...formConta, banco: e.target.value})} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo de Conta</label>
                      <select value={formConta.tipoConta} onChange={(e) => setFormConta({...formConta, tipoConta: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none">
                        <option value="CORRENTE">Corrente</option>
                        <option value="POUPANCA">Poupança</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Agência</label>
                      <input type="text" value={formConta.agencia} onChange={(e) => setFormConta({...formConta, agencia: e.target.value})} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Conta</label>
                      <input type="text" value={formConta.conta} onChange={(e) => setFormConta({...formConta, conta: e.target.value})} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Titular</label>
                <input type="text" value={formConta.titular} onChange={(e) => setFormConta({...formConta, titular: e.target.value})} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">CPF/CNPJ do Titular</label>
                <input type="text" value={formConta.cpfCnpj} onChange={(e) => setFormConta({...formConta, cpfCnpj: e.target.value})} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={formConta.principal} onChange={(e) => setFormConta({...formConta, principal: e.target.checked})} className="w-4 h-4" />
                <span className="text-sm text-gray-700">Definir como conta principal</span>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">Adicionar</button>
                <button type="button" onClick={() => setMostrarModalConta(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
