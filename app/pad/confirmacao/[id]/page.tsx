'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Package, Home } from 'lucide-react';

export default function ConfirmacaoPagamentoPage() {
  const params = useParams();
  const router = useRouter();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPedido();
  }, []);

  const carregarPedido = async () => {
    try {
      const response = await fetch(`/api/pad/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setPedido(data.pedido);
      }
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        
        {/* Card de Sucesso */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          
          {/* Ícone de Sucesso */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            🎉 Pagamento Confirmado!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Seu pagamento foi processado com sucesso.
          </p>

          {/* Informações do Pedido */}
          {pedido && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-purple-600" />
                Detalhes do Pedido
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pedido:</span>
                  <span className="font-medium text-gray-900">#{pedido.hash.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Produto:</span>
                  <span className="font-medium text-gray-900">{pedido.produtoNome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium text-green-600">R$ {pedido.valor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-blue-600">Processando</span>
                </div>
              </div>
            </div>
          )}

          {/* Próximos Passos */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">📋 Próximos passos:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Você receberá uma confirmação por email/SMS</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Seu produto será enviado em breve</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Você pode acompanhar o status do pedido</span>
              </li>
            </ul>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push(`/pad/detalhes/${params.id}`)}
              className="flex-1 py-3 px-6 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center"
            >
              <Package className="w-5 h-5 mr-2" />
              Ver Detalhes do Pedido
            </button>
            
            <button
              onClick={() => router.push('/pad/buscar')}
              className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Voltar ao Início
            </button>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-500 mt-8">
            Dúvidas? Entre em contato conosco pelo WhatsApp ou email.
          </p>
        </div>

      </div>
    </div>
  );
}