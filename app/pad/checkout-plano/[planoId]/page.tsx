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
      
      console.log('🚀 Redirecionando para:', redirectUrl);
      
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