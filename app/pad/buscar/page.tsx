'use client';

import { useState } from 'react';
import { Search, Package, CreditCard, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BuscarPedidoPage() {
  const router = useRouter();
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [erro, setErro] = useState('');
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const buscarPedidos = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(true);
    setErro('');
    setPedidos([]);
    setBuscaRealizada(false);

    try {
      const cpfLimpo = cpfCnpj.replace(/\D/g, '');

      if (cpfLimpo.length !== 11 && cpfLimpo.length !== 14) {
        setErro('CPF ou CNPJ inválido');
        setBuscando(false);
        return;
      }

      const response = await fetch(`/api/pad/buscar?cpfCnpj=${cpfLimpo}`);
      const data = await response.json();

      if (response.ok) {
        setPedidos(data.pedidos || []);
        setBuscaRealizada(true);
        setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      } else {
        setErro(data.error || 'Erro ao buscar pedidos');
      }
    } catch (error) {
      setErro('Erro ao conectar com servidor');
    } finally {
      setBuscando(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_ANALISE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'AGUARDANDO_ENVIO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ENTREGUE': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'PAGO': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EM_ANALISE': return 'Em análise';
      case 'AGUARDANDO_ENVIO': return 'PAD Aprovado - Aguardando envio';
      case 'ENTREGUE': return 'PAD Aprovado - Entregue';
      case 'PAGO': return 'Pago';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
  };

  const podePagar = (pedido: any) => {
    return pedido.status === 'ENTREGUE' && !pedido.vendaId;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">
            Área de pagamento Pay After Delivery
          </h1>
          <p className="text-yellow-100 text-lg">
            Para localizar o seu pedido e prosseguir com o pagamento, preencha as informações<br />
            solicitadas abaixo, como o documento e o endereço de entrega utilizados na compra.
          </p>
        </div>
      </div>

      {/* Formulário de Busca */}
      <div className="container mx-auto px-4 -mt-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Encontre seu pedido
          </h2>

          <form onSubmit={buscarPedidos} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Insira seu CPF ou CNPJ
              </label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring focus:ring-yellow-200 transition"
                required
              />
            </div>

            {erro && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-800 text-sm font-medium">{erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={buscando}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-4 rounded-xl font-bold text-lg hover:from-yellow-600 hover:to-yellow-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {buscando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search size={20} />
                  <span>Buscar Pedido</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Resultados */}
      {buscaRealizada && (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {pedidos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Package size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600">
                Não encontramos pedidos com este CPF/CNPJ.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Seus pedidos ({pedidos.length})
              </h2>

              {pedidos.map((pedido) => (
                <div key={pedido.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {pedido.produtoNome}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Pedido: {pedido.hash}
                        </p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(pedido.status)}`}>
                        {getStatusLabel(pedido.status)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-gray-600">Valor</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          R$ {pedido.valor.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Data do pedido</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/pad/detalhes/${pedido.hash}`)}
                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center space-x-2"
                      >
                        <Eye size={20} />
                        <span>Ver Detalhes</span>
                      </button>

                      {podePagar(pedido) && (
                        <button
                          onClick={() => router.push(`/pad/pagar/${pedido.hash}`)}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-yellow-700 transition flex items-center justify-center space-x-2"
                        >
                          <CreditCard size={20} />
                          <span>Pagar Agora</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}