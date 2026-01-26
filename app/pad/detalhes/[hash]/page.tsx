'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Package, MapPin, User, CreditCard, ArrowLeft, Truck } from 'lucide-react';

export default function DetalhesPedidoPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pedido, setPedido] = useState<any>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarPedido();
  }, []);

  const carregarPedido = async () => {
    try {
      const response = await fetch(`/api/pad/${params.hash}`);
      
      if (response.ok) {
        const data = await response.json();
        setPedido(data.pedido);
      } else {
        setErro('Pedido não encontrado');
      }
    } catch (error) {
      setErro('Erro ao carregar pedido');
    } finally {
      setLoading(false);
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
      case 'APROVADO': return 'PAD Aprovado';
      case 'ENVIADO': return 'Produto enviado';
      case 'PAGO': return 'Pago';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-purple-600 text-xl">Carregando...</div>
      </div>
    );
  }

  if (erro || !pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{erro}</div>
          <button
            onClick={() => router.push('/pad/buscar')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Voltar para busca
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>
        </div>

        {/* Status do Pedido */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Status do Pedido</h1>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(pedido.status)}`}>
              {getStatusLabel(pedido.status)}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Informações do Pagamento */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Informações do Pagamento</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Método:</span>
                  <span className="font-medium text-gray-900">Pagamento Após Entrega</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium text-gray-900">R$ {pedido.valor.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Informações do Pedido */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Informações do Pedido</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hash:</span>
                  <span className="font-mono text-sm text-gray-900">{pedido.hash}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Cliente */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Informações do Cliente</h2>
          </div>

          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Nome:</span>
                <p className="font-medium text-gray-900">{pedido.clienteNome}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="font-medium text-gray-900">{pedido.clienteEmail || '-'}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Telefone:</span>
                <p className="font-medium text-gray-900">{pedido.clienteTelefone}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Documento:</span>
                <p className="font-medium text-gray-900">{pedido.clienteCpfCnpj}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Produto */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Package className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Informações do Produto</h2>
          </div>

          <div className="flex items-center space-x-4">
            {pedido.produtoImagem ? (
              <img 
                src={pedido.produtoImagem} 
                alt={pedido.produtoNome}
                className="w-24 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{pedido.produtoNome}</h3>
              <p className="text-sm text-gray-600">Quantidade: {pedido.quantidade}</p>
              <p className="text-lg font-bold text-purple-600 mt-2">R$ {pedido.valor.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Informações de Envio */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <MapPin className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Informações de Envio</h2>
          </div>

          <div className="space-y-4">
            {pedido.dataEnvio && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-800 mb-2">
                  <Truck size={20} />
                  <span className="font-semibold">Enviado em:</span>
                  <span>{new Date(pedido.dataEnvio).toLocaleDateString('pt-BR')}</span>
                </div>
                {pedido.codigoRastreio && (
                  <div className="text-sm text-blue-700">
                    <strong>Código de rastreio:</strong> 
                    <span className="font-mono ml-2">{pedido.codigoRastreio}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Endereço de entrega:</h4>
              <div className="text-gray-700 space-y-1">
                <p>{pedido.rua}, {pedido.numero}{pedido.complemento && ` - ${pedido.complemento}`}</p>
                <p>{pedido.bairro}</p>
                <p>{pedido.cidade}/{pedido.estado}</p>
                <p>CEP: {pedido.cep}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Pagar */}
        {(pedido.status === 'APROVADO' || pedido.status === 'ENVIADO') && (
          <a 
            href={`/pad/pagar/${pedido.hash}`}
            className="block w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-center rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 transition shadow-lg"
          >
            <CreditCard className="inline-block w-6 h-6 mr-2" />
            PAGAR AGORA
          </a>
        )}

        {pedido.status === 'PAGO' && (
          <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg text-center">
            <span className="text-green-700 font-bold text-lg">✓ Pagamento confirmado!</span>
          </div>
        )}

        {pedido.status === 'CANCELADO' && pedido.motivoCancelamento && (
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-700">
              <strong>Motivo do cancelamento:</strong> {pedido.motivoCancelamento}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}