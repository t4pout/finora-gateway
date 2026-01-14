'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function HomeContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  useEffect(() => {
    if (ref) {
      localStorage.setItem('ref_code', ref);
      registrarClique(ref);
    }
  }, [ref]);

  const registrarClique = async (codigo: string) => {
    try {
      await fetch('/api/afiliados/clique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo })
      });
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full bg-white shadow-sm z-50">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl"></div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Finora</div>
                <div className="text-xs text-gray-500">Pagamentos que fluem.</div>
              </div>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <a href="#recursos" className="text-gray-700 hover:text-purple-600 transition font-medium">Recursos</a>
              <a href="#precos" className="text-gray-700 hover:text-purple-600 transition font-medium">Preços</a>
              <a href="#solucoes" className="text-gray-700 hover:text-purple-600 transition font-medium">Soluções</a>
              <a href="#contato" className="text-gray-700 hover:text-purple-600 transition font-medium">Contato</a>
            </div>
            
            <div className="flex space-x-3">
              <Link href="/auth/login">
                <button className="px-6 py-2.5 text-purple-600 hover:bg-purple-50 rounded-lg transition font-semibold">
                  LOGIN
                </button>
              </Link>
              <Link href="/auth/register">
                <button className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold shadow-lg shadow-purple-600/30">
                  SOLICITAR CADASTRO
                </button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Decole suas vendas com
                <br />
                <span className="text-purple-600">a melhor</span>
                <br />
                <span className="text-gray-800">plataforma!</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Crie seus produtos, acelere suas vendas, 
                gerencie seus resultados e escale seu negócio digital.
              </p>
              <Link href="/auth/register">
                <button className="px-8 py-4 bg-purple-600 text-white text-lg rounded-lg font-bold hover:bg-purple-700 transition shadow-xl shadow-purple-600/30 transform hover:scale-105">
                  EU QUERO AS MELHORES TAXAS
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white border-y border-gray-100">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">10k+</div>
              <div className="text-gray-600">Vendedores Ativos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">R$ 50M</div>
              <div className="text-gray-600">Processados/Mês</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">24h</div>
              <div className="text-gray-600">Repasse</div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="py-20 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Tudo que você precisa em <span className="text-purple-600">um só lugar</span>
            </h2>
            <p className="text-xl text-gray-600">Recursos completos para impulsionar suas vendas</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-600/50 transition">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Checkout Otimizado</h3>
              <p className="text-gray-600 leading-relaxed">
                Páginas de checkout personalizáveis com alta taxa de conversão. 
                PIX, cartão, boleto e muito mais.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-600/50 transition">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Sistema de Afiliados</h3>
              <p className="text-gray-600 leading-relaxed">
                Gestão completa de afiliados com comissões automáticas 
                e rastreamento em tempo real.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-600/50 transition">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Produtos Digitais</h3>
              <p className="text-gray-600 leading-relaxed">
                Venda cursos, ebooks, softwares com entrega automática 
                e área de membros integrada.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para decolar suas vendas?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se a milhares de vendedores que já estão faturando alto com a Finora
          </p>
          <Link href="/auth/register">
            <button className="px-10 py-5 bg-white text-purple-600 text-lg rounded-lg font-bold hover:shadow-2xl transition transform hover:scale-105">
              COMEÇAR AGORA GRÁTIS →
            </button>
          </Link>
        </div>
      </section>

      <footer className="py-16 px-6 bg-gray-900 text-gray-300">
        <div className="container mx-auto text-center">
          <div className="text-2xl font-bold mb-4 text-purple-400">Finora</div>
          <p className="mb-4">© 2026 Finora. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-purple-600 text-xl">Carregando...</div></div>}>
      <HomeContent />
    </Suspense>
  );
}
