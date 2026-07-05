'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Package, Mail, Download } from 'lucide-react';

export default function PagamentoSucessoContent() {
  const searchParams = useSearchParams();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pedidoId = searchParams?.get('pedido');
  const purchaseDisparado = useRef(false);

  useEffect(() => {
    if (pedidoId) {
      fetch(`/api/pedido/${pedidoId}`)
        .then(res => res.json())
        .then(data => {
          setPedido(data);
          setLoading(false);

          // Carregar pixel e disparar Purchase
          if (!purchaseDisparado.current) {
            const produtoId = data.venda?.produtoId || data.produtoId;
            if (produtoId) {
              fetch(`/api/produtos/${produtoId}`)
                .then(r => r.json())
                .then(pixelData => {
                  const pixels = pixelData.produto?.pixels || [];
                  pixels.forEach((pixel: any) => {
                    if (pixel.plataforma === 'FACEBOOK' && pixel.pixelId && pixel.eventoCompra) {
                      if (!(window as any).fbq) {
                        const script = document.createElement('script');
                        script.innerHTML = `
                          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                          n.queue=[];t=b.createElement(e);t.async=!0;
                          t.src=v;s=b.getElementsByTagName(e)[0];
                          s.parentNode.insertBefore(t,s)}(window,document,'script',
                          'https://connect.facebook.net/en_US/fbevents.js');
                          fbq('init', '${pixel.pixelId}');
                        `;
                        document.head.appendChild(script);
                      }
                      const tentarDisparar = (tentativas: number) => {
                        if ((window as any).fbq) {
                          try {
                            (window as any).fbq('track', 'Purchase', {
                              value: data.venda?.valor || data.valor,
                              currency: 'BRL',
                              content_name: data.venda?.nomePlano || data.produto?.nome || '',
                              content_ids: [produtoId],
                              content_type: 'product',
                              transaction_id: data.venda?.id || data.id
                            });
                            purchaseDisparado.current = true;
                            console.log('✅ Purchase disparado pixel:', pixel.pixelId);
                          } catch (e) { console.error('Erro pixel Purchase:', e); }
                        } else if (tentativas > 0) {
                          setTimeout(() => tentarDisparar(tentativas - 1), 1000);
                        }
                      };
                      setTimeout(() => tentarDisparar(5), 500);
                    }
                  });
                })
                .catch(e => console.error('Erro ao carregar pixels:', e));
            }
          }
        })
        .catch(() => setLoading(false));
    }
  }, [pedidoId]);

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

  const venda = pedido?.venda || pedido;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h1>
        <p className="text-gray-500 mb-6">Sua compra foi realizada com sucesso.</p>

        {venda && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3">
              <Package size={20} className="text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Produto</p>
                <p className="font-semibold text-gray-900">{venda.produto?.nome || venda.nomePlano || 'Produto'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-semibold text-gray-900">{venda.compradorEmail}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-gray-600 font-medium">Total pago</span>
              <span className="text-xl font-bold text-green-600">
                R$ {(venda.valor || 0).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500">
          Você receberá um email de confirmação em breve. Obrigado pela sua compra!
        </p>
      </div>
    </div>
  );
}