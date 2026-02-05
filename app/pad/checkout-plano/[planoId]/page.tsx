'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CheckoutPadPlanoPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    console.log('🔄 Iniciando redirect de checkout-plano...');
    criarPedidoPAD();
  }, []);

  const criarPedidoPAD = async () => {
    try {
      console.log('📦 Buscando plano:', params.planoId);
      
      // Buscar dados do plano
      const resPlano = await fetch(`/api/planos/${params.planoId}`);

      if (!resPlano.ok) {
        setErro('Plano não encontrado');
        setLoading(false);
        return;
      }

      const dataPlano = await resPlano.json();
      const plano = dataPlano.plano;
      
      console.log('✅ Plano encontrado:', plano);

      // Redirecionar para a página de criar pedido PAD com os dados do plano
      const redirectUrl = `/pad/criar?planoId=${plano.id}&produtoId=${plano.produtoId}&valor=${plano.preco}&nome=${encodeURIComponent(plano.nome)}`;
      
      // Carregar e disparar pixel ANTES do redirect
      try {
        const pixelRes = await fetch(`/api/pixels?produtoId=${plano.produtoId}`);
        const pixelData = await pixelRes.json();
        
        if (pixelData.pixels && pixelData.pixels[0] && pixelData.pixels[0].plataforma === 'FACEBOOK') {
          const pixel = pixelData.pixels[0];
          console.log('📊 Carregando pixel antes do redirect:', pixel.pixelId);
          
          // Carregar Facebook Pixel
          if (!(window as any).fbq) {
            (function(f: any,b: any,e: any,v: any,n?: any,t?: any,s?: any){
              if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
            })(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
          }
          
          (window as any).fbq('init', pixel.pixelId);
          (window as any).fbq('track', 'PageView');
          (window as any).fbq('track', 'InitiateCheckout', {
            content_name: plano.nome,
            content_ids: [plano.produtoId],
            content_type: 'product',
            value: plano.preco,
            currency: 'BRL'
          });
          
          console.log('✅ Pixel disparado antes do redirect');
          
          // Aguardar 500ms para garantir que o evento foi enviado
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (e) {
        console.error('Erro ao carregar pixel:', e);
      }
      
      console.log('🚀 Redirecionando para:', redirectUrl);
      
      // Delay de 800ms para garantir que scripts carreguem
      await new Promise(resolve => setTimeout(resolve, 800));
      
      router.push(redirectUrl);
      
      // Fallback: se router.push não funcionar, usar window.location
      setTimeout(() => {
        if (window.location.pathname.includes('checkout-plano')) {
          console.log('⚠️ Router.push falhou, usando window.location');
          window.location.href = redirectUrl;
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Erro:', error);
      setErro('Erro ao processar checkout');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-purple-600 text-xl">Processando checkout...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{erro}</div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return null;
}