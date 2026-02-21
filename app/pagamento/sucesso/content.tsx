'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Package, Mail, Download } from 'lucide-react';

export default function PagamentoSucessoContent() {
  const searchParams = useSearchParams();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const purchaseDisparado = useRef(false);

  const pedidoId = searchParams?.get('pedido');

  useEffect(() => {
    if (pedidoId) {
      fetch(`/api/pedido/${pedidoId}`)
        .then(res => res.json())
        .then(data => {
          setPedido(data);
          setLoading(false);
          // Carregar pixels e disparar Purchase
          if (data?.venda?.produtoId || data?.produto?.id) {
            const produtoId = data?.produto?.id || data?.venda?.produtoId;
            carregarPixelsEDispararPurchase(produtoId, data);
          }
        })
        .catch(() => setLoading(false));
    }
  }, [pedidoId]);

  const carregarPixelsEDispararPurchase = async (produtoId: string, pedidoData: any) => {
    if (purchaseDisparado.current) return;
    try {
      const res = await fetch(`/api/produtos/${produtoId}`);
      if (!res.ok) return;
      const data = await res.json();
      const produto = data.produto;

      if (produto.pixels && produto.pixels.length > 0) {
        produto.pixels.forEach((pixel: any) => {
          if (pixel.plataforma === 'FACEBOOK' && pixel.pixelId) {
            // Injetar pixel se ainda não foi injetado
            if (!(window as any).fbq) {
              const script = document.createElement('script');
              script.innerHTML = `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixel.pixelId}');
                fbq('track', 'PageView');
              `;
              document.head.appendChild(script);
            }

            // Disparar Purchase após 800ms para garantir fbq carregado
            setTimeout(() => {
              if (purchaseDisparado.current) return;
              if (typeof window !== 'undefined' && (window as any).fbq) {
                try {
                  (window as any).fbq('track', 'Purchase', {
                    content_name: pedidoData?.produto?.nome || '',
                    content_ids: [produtoId],
                    content_type: 'product',
                    value: pedidoData?.valor || pedidoData?.venda?.valor || 0,
                    currency: 'BRL'
                  });
                  purchaseDisparado.current = true;
                  console.log('📊 Pixel: Purchase disparado');
                } catch (e) { console.error('Erro pixel Purchase:', e); }
              }
            }, 800);
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar pixels:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pagamento Confirmado! 🎉
            </h1>
            <p className="text-lg text-gray-600">
              Seu pedido foi recebido com sucesso
            </p>
          </div>

          {pedido && (
            <div className="border-t border-b border-gray-200 py-6 my-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Número do Pedido</p>
                  <p className="text-lg font-semibold text-gray-900">
                    #{pedido.id?.substring(0, 8).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor Pago</p>
                  <p className="text-lg font-semibold text-green-600">
                    R$ {pedido.valor?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Produto</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {pedido.produto?.nome || 'Produto'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Pago
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Próximos passos:
            </h2>
            
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Preparando seu pedido</h3>
                <p className="text-sm text-gray-600">Já estamos separando e preparando tudo para você</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
              <Mail className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Confirmação por e-mail</h3>
                <p className="text-sm text-gray-600">Enviamos todos os detalhes para seu e-mail</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <Download className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Acesso liberado</h3>
                <p className="text-sm text-gray-600">Se for produto digital, o acesso já está disponível</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">Precisa de ajuda? Entre em contato conosco</p>
          <a href="mailto:suporte@finorapayments.com" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
            Falar com Suporte
          </a>
        </div>

        <div className="text-center mt-8">
          <a href="/" className="text-gray-600 hover:text-gray-900 font-medium">← Voltar para o início</a>
        </div>
      </div>
    </div>
  );
}