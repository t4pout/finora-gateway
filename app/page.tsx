'use client';

import Image from 'next/image';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Menu, X, Zap, ShieldCheck, Wallet, Users, Package, Webhook, BarChart3, CreditCard } from 'lucide-react';

function HomeContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const [menuAberto, setMenuAberto] = useState(false);

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

  const linksNav = [
    { href: '#recursos', label: 'Recursos' },
    { href: '#precos', label: 'Preços' },
    { href: '#como-funciona', label: 'Como Funciona' },
    { href: '#contato', label: 'Contato' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Finora - Pagamentos que fluem"
                width={180}
                height={50}
                priority
                className="h-10 md:h-12 w-auto"
              />
            </Link>

            <div className="hidden md:flex space-x-8">
              {linksNav.map(l => (
                <a key={l.href} href={l.href} className="text-gray-700 hover:text-purple-600 transition font-medium">{l.label}</a>
              ))}
            </div>

            <div className="hidden md:flex space-x-3">
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

            {/* Botão mobile */}
            <button onClick={() => setMenuAberto(true)} className="md:hidden p-2 text-gray-700">
              <Menu size={26} />
            </button>
          </div>
        </nav>
      </header>

      {/* MENU MOBILE */}
      {menuAberto && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-[60]" onClick={() => setMenuAberto(false)}>
          <div className="absolute top-0 right-0 w-72 h-full bg-white p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <Image src="/logo.png" alt="Finora" width={140} height={40} className="h-9 w-auto" />
              <button onClick={() => setMenuAberto(false)} className="p-1 text-gray-500"><X size={24} /></button>
            </div>
            <div className="flex flex-col space-y-1">
              {linksNav.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMenuAberto(false)} className="px-3 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition font-medium">{l.label}</a>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-3">
              <Link href="/auth/login" onClick={() => setMenuAberto(false)}>
                <button className="w-full px-6 py-3 text-purple-600 border-2 border-purple-200 rounded-lg font-semibold">LOGIN</button>
              </Link>
              <Link href="/auth/register" onClick={() => setMenuAberto(false)}>
                <button className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold">SOLICITAR CADASTRO</button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* HERO ESCURO COM LOGO BRILHOSA */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a0714] via-[#160f2e] to-[#1c1440] text-white pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-purple-600/25 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-6 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-sm font-medium text-purple-200 mb-6">
                Pagamentos que fluem
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Decole suas vendas com
                <br />
                <span className="text-purple-400">a melhor</span>{' '}
                <span className="text-white">plataforma</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">
                Crie seus produtos, acelere suas vendas, gerencie seus resultados e escale seu negócio digital — tudo em um só lugar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/auth/register">
                  <button className="w-full sm:w-auto px-8 py-4 bg-purple-600 text-white text-lg rounded-lg font-bold hover:bg-purple-500 transition shadow-xl shadow-purple-600/40 transform hover:scale-105">
                    EU QUERO AS MELHORES TAXAS
                  </button>
                </Link>
                <a href="#precos">
                  <button className="w-full sm:w-auto px-8 py-4 bg-white/10 border border-white/20 text-white text-lg rounded-lg font-semibold hover:bg-white/20 transition">
                    Ver taxas
                  </button>
                </a>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="relative w-56 h-56 md:w-80 md:h-80">
                <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-[70px]"></div>
                <Image
                  src="/icon-512.png"
                  alt="Finora"
                  width={512}
                  height={512}
                  priority
                  className="relative w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NÚMEROS */}
      <section className="py-16 px-6 bg-white border-y border-gray-100">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">10k+</div>
              <div className="text-gray-600 text-sm md:text-base">Vendedores Ativos</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">R$ 50M</div>
              <div className="text-gray-600 text-sm md:text-base">Processados/Mês</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-gray-600 text-sm md:text-base">Uptime</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">24h</div>
              <div className="text-gray-600 text-sm md:text-base">Repasse</div>
            </div>
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="py-20 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">
              Tudo que você precisa em <span className="text-purple-600">um só lugar</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600">Recursos completos para impulsionar suas vendas</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white rounded-2xl p-7 md:p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-600/50 transition">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <CreditCard size={28} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">Checkout Otimizado</h3>
              <p className="text-gray-600 leading-relaxed">
                Páginas de checkout personalizáveis com alta taxa de conversão. PIX, cartão, boleto e muito mais.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 md:p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-600/50 transition">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <Users size={28} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">Sistema de Afiliados</h3>
              <p className="text-gray-600 leading-relaxed">
                Gestão completa de afiliados com comissões automáticas e rastreamento em tempo real.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 md:p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-600/50 transition">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <Package size={28} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">Produtos Digitais e Físicos</h3>
              <p className="text-gray-600 leading-relaxed">
                Venda cursos, ebooks, softwares ou produtos físicos com entrega e logística integradas.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 md:p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-600/50 transition">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <Wallet size={28} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">Carteira e Saques</h3>
              <p className="text-gray-600 leading-relaxed">
                Acompanhe saldo, transações e solicite saques com prazos claros e aprovação rápida.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 md:p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-600/50 transition">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <Webhook size={28} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">Webhooks e Integrações</h3>
              <p className="text-gray-600 leading-relaxed">
                Conecte com CRMs, ERPs, ferramentas de automação e plataformas de tráfego via Webhooks e Postbacks.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 md:p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-600/50 transition">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 size={28} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">Pixels e Relatórios</h3>
              <p className="text-gray-600 leading-relaxed">
                Facebook, Google, TikTok e Kwai com disparo correto de eventos, além de relatórios completos de UTM.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PREÇOS */}
      <section id="precos" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">
              Taxas <span className="text-purple-600">justas e transparentes</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600">Sem mensalidade, sem taxa de adesão. Você só paga quando vende.</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl shadow-purple-600/30">
            <div className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-3">A partir de</div>
            <div className="text-5xl md:text-6xl font-bold mb-2">3,99% <span className="text-3xl md:text-4xl font-semibold">+ R$0,99</span></div>
            <div className="text-lg opacity-90 mb-8">por transação aprovada</div>
            <div className="grid sm:grid-cols-3 gap-4 text-left">
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="font-bold mb-1">PIX</div>
                <div className="text-sm opacity-80">Liberação rápida do saldo</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="font-bold mb-1">Cartão de Crédito</div>
                <div className="text-sm opacity-80">Com opção de parcelamento</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="font-bold mb-1">Boleto</div>
                <div className="text-sm opacity-80">Fallback automático</div>
              </div>
            </div>
            <p className="text-sm opacity-75 mt-8">
              Taxas podem variar conforme volume de vendas e plano contratado. Fale com nosso time para uma condição personalizada.
            </p>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">
              Como <span className="text-purple-600">funciona</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600">Do cadastro à primeira venda em minutos</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 bg-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-600/30">1</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Crie sua conta</h3>
              <p className="text-gray-600 leading-relaxed">Cadastro rápido e verificação simples para liberar sua conta com segurança.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 bg-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-600/30">2</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Configure seu produto</h3>
              <p className="text-gray-600 leading-relaxed">Monte seu checkout, defina preços e ative pixels de conversão em poucos cliques.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 bg-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-600/30">3</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Venda e receba</h3>
              <p className="text-gray-600 leading-relaxed">Acompanhe suas vendas em tempo real e solicite saques direto para sua conta.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#160f2e] to-purple-800 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="container mx-auto text-center relative">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Pronto para decolar suas vendas?
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se a milhares de vendedores que já estão faturando alto com a Finora
          </p>
          <Link href="/auth/register">
            <button className="w-full sm:w-auto px-10 py-5 bg-white text-purple-700 text-lg rounded-lg font-bold hover:shadow-2xl transition transform hover:scale-105">
              COMEÇAR AGORA GRÁTIS →
            </button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contato" className="py-16 px-6 bg-gray-900 text-gray-300">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="text-2xl font-bold mb-4 text-purple-400">Finora</div>
              <p className="text-sm text-gray-400 leading-relaxed">
                A plataforma completa para gestão de pagamentos e vendas online.
              </p>
              <div className="mt-4 text-sm text-gray-500">
                CNPJ: 65.732.906/0001-46
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#recursos" className="hover:text-purple-400 transition">Recursos</a></li>
                <li><a href="#precos" className="hover:text-purple-400 transition">Preços</a></li>
                <li><a href="#como-funciona" className="hover:text-purple-400 transition">Como Funciona</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/termos" className="hover:text-purple-400 transition">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-purple-400 transition">Política de Privacidade</Link></li>
                <li><Link href="/docs" className="hover:text-purple-400 transition">Documentação da API</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Contato</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contato" className="hover:text-purple-400 transition">Fale Conosco</Link></li>
                <li><a href="mailto:contato@finorapayments.com" className="hover:text-purple-400 transition break-all">contato@finorapayments.com</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 Finora Payments. Todos os direitos reservados.</p>
          </div>
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