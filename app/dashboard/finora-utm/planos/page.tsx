'use client';

import Sidebar from '@/app/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Check, BarChart3, Link2, Plug, Lock } from 'lucide-react';

interface User {
  nome: string;
  role?: string;
  finoraUtmAtivo?: boolean;
}

export default function FinoraUTMPlanos() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      if (u.finoraUtmAtivo) { router.replace('/finora-utm'); return; }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const planos = [
    {
      nome: 'Starter',
      preco: 'R$ 47',
      periodo: '/mes',
      descricao: 'Para quem esta comecando',
      recursos: ['10 links UTM ativos', '5.000 cliques por mes', 'Relatorio basico por fonte', 'Historico de 30 dias'],
      destaque: false,
      link: 'https://wa.me/SEU_NUMERO?text=Quero+Finora+UTM+Starter'
    },
    {
      nome: 'Pro',
      preco: 'R$ 97',
      periodo: '/mes',
      descricao: 'Para quem escala campanhas',
      recursos: ['Links UTM ilimitados', '50.000 cliques por mes', 'Dashboard completo', 'Relatorios por source, medium e campaign', 'Historico de 90 dias'],
      destaque: true,
      link: 'https://wa.me/SEU_NUMERO?text=Quero+Finora+UTM+Pro'
    },
    {
      nome: 'Enterprise',
      preco: 'R$ 197',
      periodo: '/mes',
      descricao: 'Para operacoes avancadas',
      recursos: ['Tudo do Pro', 'Cliques ilimitados', 'Integracao Meta Ads', 'Integracao TikTok Ads', 'ROAS automatico', 'Suporte prioritario'],
      destaque: false,
      link: 'https://wa.me/SEU_NUMERO?text=Quero+Finora+UTM+Enterprise'
    }
  ];

  const funcionalidades = [
    { icone: Link2, titulo: 'Links UTM rastreados', descricao: 'Gere links com parametros UTM salvos no banco de dados' },
    { icone: BarChart3, titulo: 'Relatorios por campanha', descricao: 'Veja receita, conversoes e taxa de aprovacao por canal' },
    { icone: Plug, titulo: 'Integracao com anuncios', descricao: 'Conecte Meta, TikTok e Google para ver ROAS real' },
    { icone: TrendingUp, titulo: 'Dashboard completo', descricao: 'Visao geral de todas as suas campanhas em tempo real' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Finora UTM</h1>
              <p className="text-sm text-gray-500">Rastreamento inteligente de campanhas</p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              <Lock size={14} />
              <span>Modulo adicional</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Saiba exatamente de onde vem suas vendas</h2>
            <p className="text-gray-500 max-w-xl mx-auto">O Finora UTM e um modulo de rastreamento completo integrado ao seu gateway.</p>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-10">
            {funcionalidades.map((f, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-3">
                  <f.icone size={20} />
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-1">{f.titulo}</div>
                <div className="text-gray-500 text-xs">{f.descricao}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            {planos.map((plano, i) => (
              <div key={i} className={'bg-white rounded-2xl border-2 p-6 relative ' + (plano.destaque ? 'border-purple-600 shadow-lg' : 'border-gray-200')}>
                {plano.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">Mais popular</span>
                  </div>
                )}
                <div className="mb-5">
                  <div className="text-sm font-semibold text-gray-500 mb-1">{plano.nome}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">{plano.preco}</span>
                    <span className="text-gray-400 text-sm">{plano.periodo}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{plano.descricao}</div>
                </div>
                <div className="space-y-2 mb-6">
                  {plano.recursos.map((r, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check size={14} className="text-green-500 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
                <a href={plano.link} target="_blank" rel="noopener noreferrer"
                  className={'block w-full py-3 rounded-xl text-sm font-bold text-center transition ' + (plano.destaque ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200')}>
                  Contratar {plano.nome}
                </a>
              </div>
            ))}
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-center">
            <p className="text-purple-700 text-sm">Duvidas? Fale com nosso suporte pelo WhatsApp</p>
            <a href="https://wa.me/SEU_NUMERO" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 px-5 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition">
              Falar com suporte
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
