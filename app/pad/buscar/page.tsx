'use client';

import { useState } from 'react';
import { Search, Package, CreditCard } from 'lucide-react';

export default function BuscarPedidoPage() {
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
      case 'APROVADO': return 'bg-green-100 text-green-800 border-green-200';
      case 'ENVIADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PAGO': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EM_ANALISE': return 'Em análise';
      case 'APROVADO': return 'Aguardando envio';
      case 'ENVIADO': return 'Produto enviado';
      case 'PAGO': return 'Pago';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
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
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Digite seu CPF ou CNPJ..."
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl text-gray-900 text-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition"
                />
              </div>
            </div>

            {erro && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={buscando}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 transition shadow-lg"
            >
              {buscando ? 'BUSCANDO...' : 'ENCONTRAR COMPRA'}
            </button>
          </form>

          {/* Informações Importantes */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-600 text-xl">⚠️</div>
              <div className="text-sm text-yellow-800">
                <strong>Informações importantes:</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Use o mesmo documento usado na compra</li>
                  <li>CPF: 11 dígitos (000.000.000-00)</li>
                  <li>CNPJ: 14 dígitos (00.000.000/0000-00)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados da Busca */}
      {buscaRealizada && (
        <div className="container mx-auto px-4 mt-8 max-w-4xl mb-12">
          {pedidos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600">
                Não encontramos pedidos com o documento informado.<br />
                Verifique se digitou corretamente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Seus pedidos ({pedidos.length})
              </h3>

              {pedidos.map((pedido) => (
                <div key={pedido.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        {pedido.produtoImagem ? (
                          <img 
                            src={pedido.produtoImagem} 
                            alt={pedido.produtoNome}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{pedido.produtoNome}</h4>
                          <p className="text-sm text-gray-600">Pedido #{pedido.hash}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Realizado em {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          R$ {pedido.valor.toFixed(2)}
                        </div>
                        <span className={`inline-block mt-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(pedido.status)}`}>
                          {getStatusLabel(pedido.status)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">Endereço de entrega:</span>
                          <p className="font-medium text-gray-900">
                            {pedido.rua}, {pedido.numero}
                            {pedido.complemento && ` - ${pedido.complemento}`}
                          </p>
                          <p className="text-gray-600">
                            {pedido.bairro} - {pedido.cidade}/{pedido.estado}
                          </p>
                        </div>
                        {pedido.codigoRastreio && (
                          <div>
                            <span className="text-gray-600">Código de rastreio:</span>
                            <p className="font-mono font-medium text-gray-900">
                              {pedido.codigoRastreio}
                            </p>
                          </div>
                        )}
                      </div>

                      {(pedido.status === 'APROVADO' || pedido.status === 'ENVIADO') && (
  <div className="grid grid-cols-2 gap-3">
    <a 
      href={`/pad/detalhes/${pedido.hash}`}
      className="block py-3 bg-gray-100 text-gray-700 text-center rounded-lg font-bold hover:bg-gray-200 transition"
    >
      Ver detalhes
    </a>
    <a 
      href={`/pad/pagar/${pedido.hash}`}
      className="block py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-center rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition"
    >
      <CreditCard className="inline-block w-5 h-5 mr-2" />
      Pagar agora
    </a>
  </div>
)}

                      {pedido.status === 'PAGO' && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                          <span className="text-green-700 font-semibold">✓ Pagamento confirmado!</span>
                        </div>
                      )}

                      {pedido.status === 'CANCELADO' && pedido.motivoCancelamento && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">
                            <strong>Motivo do cancelamento:</strong> {pedido.motivoCancelamento}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-50 border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>Precisa de ajuda? Entre em contato conosco</p>
        </div>
      </div>
    </div>
  );
}