'use client';

import { Plug, CheckCircle, Circle } from 'lucide-react';

export default function FinoraUTMIntegracoes() {
  const plataformas = [
    { nome: 'Meta Ads', descricao: 'Facebook e Instagram Ads — importe gastos e ROAS automaticamente', cor: 'bg-blue-900 text-blue-300', disponivel: false },
    { nome: 'TikTok Ads', descricao: 'Importe dados de campanhas do TikTok Ads Manager', cor: 'bg-pink-900 text-pink-300', disponivel: false },
    { nome: 'Google Ads', descricao: 'Importe gastos e conversoes do Google Ads', cor: 'bg-green-900 text-green-300', disponivel: false },
    { nome: 'Kwai Ads', descricao: 'Importe dados de campanhas do Kwai', cor: 'bg-amber-900 text-amber-300', disponivel: false },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Integracoes</h1>
        <p className="text-gray-500 text-sm">Conecte suas contas de anuncio para importar gastos e calcular ROAS automaticamente</p>
      </div>

      <div className="bg-amber-900 border border-amber-700 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Plug size={18} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-amber-300 font-semibold text-sm mb-1">Em desenvolvimento</div>
            <div className="text-amber-400 text-xs">As integracoes com plataformas de anuncio estao sendo desenvolvidas. Em breve voce podera conectar suas contas de Meta Ads, TikTok, Google e Kwai para importar automaticamente os gastos de cada campanha e ver o ROAS real no dashboard.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {plataformas.map((p, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={'px-2 py-1 rounded text-xs font-semibold ' + p.cor}>{p.nome}</span>
              </div>
              <Circle size={18} className="text-gray-600" />
            </div>
            <p className="text-gray-400 text-xs mb-4">{p.descricao}</p>
            <button disabled className="w-full py-2 bg-gray-700 text-gray-500 rounded-lg text-xs font-semibold cursor-not-allowed">
              Em breve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}