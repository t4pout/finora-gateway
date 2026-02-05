'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function FacebookPixel() {
  console.log('🔍 FacebookPixel component mounted');
  const pathname = usePathname();

  useEffect(() => {
    // Carregar pixels ativos
    const carregarPixels = async () => {
      try {
        // Extrair produtoId da URL se for checkout PAD
        const searchParams = new URLSearchParams(window.location.search);
        const produtoId = searchParams.get('produtoId');

        if (!produtoId) return;

        const response = await fetch(`/api/pixels?produtoId=${produtoId}`);
        const data = await response.json();

        if (data.pixels && data.pixels.length > 0) {
          data.pixels.forEach((pixel: any) => {
            if (pixel.plataforma === 'FACEBOOK') {
              // Carregar Facebook Pixel
              if (!(window as any).fbq) {
                (function(f: any,b: any,e: any,v: any,n?: any,t?: any,s?: any){
                  if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)
                })(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
              }

              (window as any).fbq('init', pixel.pixelId);
              (window as any).fbq('track', 'PageView');
              
              console.log('📊 Facebook Pixel carregado:', pixel.pixelId);
            }
          });
        }
      } catch (error) {
        console.error('Erro ao carregar pixels:', error);
      }
    };

    // Só carregar em páginas de checkout PAD
    if (pathname.includes('/pad/criar')) {
      carregarPixels();
    }
  }, [pathname]);

  return null;
}