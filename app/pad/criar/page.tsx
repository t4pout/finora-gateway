'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CriarPedidoPADPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const planoId = searchParams.get('planoId');
  const produtoId = searchParams.get('produtoId');
  const valor = searchParams.get('valor');
  const nomePlano = searchParams.get('nome');

  const [formData, setFormData] = useState({
    clienteNome: '',
    clienteCpfCnpj: '',
    clienteTelefone: '',
    clienteEmail: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const response = await fetch('/api/pad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          produtoId,
          produtoNome: nomePlano,
          valor: parseFloat(valor || '0'),
          quantidade: 1
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Redirecionar para a página de pagamento
        router.push(`/pad/pagar/${data.pedido.hash}`);
      } else {
        setErro(data.error || 'Erro ao criar pedido');
      }
    } catch (error) {
      console.error('Erro:', error);
      setErro('Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finalizar Pedido</h1>
          <p className="text-gray-600 mb-6">Preencha seus dados para continuar</p>

          {/* Resumo do Plano */}
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-purple-700">Plano selecionado</div>
                <div className="font-bold text-gray-900">{nomePlano}</div>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                R$ {parseFloat(valor || '0').toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>

          {erro && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Pessoais */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">📋 Dados Pessoais</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome Completo *"
                  value={formData.clienteNome}
                  onChange={(e) => setFormData({...formData, clienteNome: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="CPF/CNPJ *"
                    value={formData.clienteCpfCnpj}
                    onChange={(e) => setFormData({...formData, clienteCpfCnpj: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Telefone *"
                    value={formData.clienteTelefone}
                    onChange={(e) => setFormData({...formData, clienteTelefone: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.clienteEmail}
                  onChange={(e) => setFormData({...formData, clienteEmail: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">📍 Endereço de Entrega</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="CEP *"
                  value={formData.cep}
                  onChange={(e) => setFormData({...formData, cep: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Rua *"
                    value={formData.rua}
                    onChange={(e) => setFormData({...formData, rua: e.target.value})}
                    required
                    className="md:col-span-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Número *"
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Complemento"
                  value={formData.complemento}
                  onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <input
                  type="text"
                  placeholder="Bairro *"
                  value={formData.bairro}
                  onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Cidade *"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    required
                    className="md:col-span-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="UF *"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    required
                    maxLength={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'PROCESSANDO...' : 'CONTINUAR PARA PAGAMENTO'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}