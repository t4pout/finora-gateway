'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Package, CheckCircle, XCircle } from 'lucide-react';

export default function AguardandoAprovacaoPage() {
  const params = useParams();
  const router = useRouter();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPedido();
    const interval = setInterval(carregarPedido, 5000); // Atualiza a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const carregarPedido = async () => {
    try {
      const response = await fetch(`/api/pad/${params.hash}`);
      if (response.ok) {
        const data = await response.json();
        setPedido(data.pedido);
        
        // Se foi aprovado, redireciona para pagamento
        if (data.pedido.status === 'APROVADO') {
          setTimeout(() => {
            router.push(`/pad/pagar/${params.hash}`);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-purple-600 text-xl">Carregando...</div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Pedido não encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          
          {/* Ícone baseado no status */}
          <div className="flex justify-center mb-6">
            {pedido.status === 'EM_ANALISE' && (
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-16 h-16 text-blue-600 animate-pulse" />
              </div>
            )}
            {pedido.status === 'APROVADO' && (
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            )}
            {pedido.status === 'CANCELADO' && (
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-16 h-16 text-red-600" />
              </div>
            )}
          </div>

          {/* Título baseado no status */}
          {pedido.status === 'EM_ANALISE' && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                ⏳ Pedido em Análise
              </h1>
              <p className="text-gray-600 mb-8">
                Seu pedido foi recebido e está sendo analisado pelo vendedor.
              </p>
            </>
          )}
          {pedido.status === 'APROVADO' && (
            <>
              <h1 className="text-3xl font-bold text-green-600 mb-3">
                ✅ Pedido Aprovado!
              </h1>
              <p className="text-gray-600 mb-8">
                Redirecionando para pagamento...
              </p>
            </>
          )}
          {pedido.status === 'CANCELADO' && (
            <>
              <h1 className="text-3xl font-bold text-red-600 mb-3">
                ❌ Pedido Cancelado
              </h1>
              <p className="text-gray-600 mb-8">
                Seu pedido foi cancelado pelo vendedor.
              </p>
              {pedido.motivoCancelamento && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                  <p className="text-red-700 text-sm">
                    <strong>Motivo:</strong> {pedido.motivoCancelamento}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Detalhes do Pedido */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-center">
              <Package className="w-5 h-5 mr-2 text-purple-600" />
              Detalhes do Pedido
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Pedido:</span>
                <span className="font-bold text-gray-900">#{pedido.hash.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Produto:</span>
                <span className="font-medium text-gray-900">{pedido.produtoNome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor:</span>
                <span className="font-bold text-purple-600">R$ {pedido.valor.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  pedido.status === 'EM_ANALISE' ? 'bg-yellow-100 text-yellow-700' :
                  pedido.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {pedido.status === 'EM_ANALISE' ? 'Em Análise' :
                   pedido.status === 'APROVADO' ? 'Aprovado' : 'Cancelado'}
                </span>
              </div>
            </div>
          </div>

          {/* Próximos passos (apenas se em análise) */}
          {pedido.status === 'EM_ANALISE' && (
            <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-3">📋 Próximos Passos:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">1️⃣</span>
                  <span>O vendedor analisará seu pedido em breve</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2️⃣</span>
                  <span>Você receberá uma confirmação por email/SMS</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3️⃣</span>
                  <span>Após a aprovação, você poderá realizar o pagamento</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4️⃣</span>
                  <span>Seu produto será enviado após a confirmação do pagamento</span>
                </li>
              </ul>
            </div>
          )}

          {/* Botão de buscar pedido */}
          <button
            onClick={() => router.push('/pad/buscar')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            Buscar Meu Pedido
          </button>

          {/* Info de atualização automática */}
          {pedido.status === 'EM_ANALISE' && (
            <div className="text-xs text-gray-500 mt-6">
              💡 Esta página atualiza automaticamente a cada 5 segundos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}