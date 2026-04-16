'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Circle, Trash2 } from 'lucide-react';

interface Integracao {
  accountNome: string;
}

export default function FinoraUTMIntegracoes() {
  const [metaConectado, setMetaConectado] = useState(false);
  const [metaInfo, setMetaInfo] = useState<Integracao | null>(null);
  const [loading, setLoading] = useState(true);
  const [conectando, setConectando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sucesso') === 'meta') setSucesso('Meta Ads conectado com sucesso!');
    if (params.get('erro')) setErro('Erro ao conectar: ' + params.get('erro'));
    verificarIntegracoes();
  }, []);

  const verificarIntegracoes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/integracoes/meta/dados', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setMetaConectado(true);
        setMetaInfo({ accountNome: data.accountNome });
      } else {
        setMetaConectado(false);
        setMetaInfo(null);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const conectarMeta = async () => {
    setConectando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/integracoes/meta', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        alert('Erro ao iniciar conexao');
      }
    } catch (e) { alert('Erro ao conectar'); }
    setConectando(false);
  };

  const desconectarMeta = async () => {
    if (!confirm('Deseja desconectar o Meta Ads?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/integracoes/meta/dados', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      setMetaConectado(false);
      setMetaInfo(null);
    } catch (e) { alert('Erro ao desconectar'); }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Integracoes</h1>
        <p className="text-gray-500 text-sm">Conecte suas contas de anuncio para importar gastos e calcular ROAS automaticamente</p>
      </div>

      {sucesso && (
        <div className="bg-green-900 border border-green-700 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-400 shrink-0" />
          <span className="text-green-300 text-sm">{sucesso}</span>
        </div>
      )}

      {erro && (
        <div className="bg-red-900 border border-red-700 rounded-xl p-4 mb-6">
          <span className="text-red-300 text-sm">{erro}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className={'bg-gray-800 border rounded-xl p-5 ' + (metaConectado ? 'border-green-700' : 'border-gray-700')}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-blue-300 font-bold text-sm">f</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Meta Ads</div>
                <div className="text-gray-500 text-xs">Facebook e Instagram</div>
              </div>
            </div>
            {metaConectado
              ? <CheckCircle size={18} className="text-green-400" />
              : <Circle size={18} className="text-gray-600" />
            }
          </div>

          {loading ? (
            <div className="text-gray-500 text-xs mb-4">Verificando...</div>
          ) : metaConectado ? (
            <div className="mb-4">
              <div className="bg-green-900 border border-green-800 rounded-lg px-3 py-2">
                <div className="text-green-400 text-xs font-semibold">Conectado</div>
                {metaInfo?.accountNome && (
                  <div className="text-green-300 text-xs mt-0.5">{metaInfo.accountNome}</div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-xs mb-4">Importe gastos de campanhas do Meta Ads e calcule o ROAS automaticamente cruzando com suas vendas.</p>
          )}

          <div className="flex gap-2">
            {!loading && !metaConectado && (
              <button onClick={conectarMeta} disabled={conectando}
                className="w-full py-2 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition disabled:opacity-50">
                {conectando ? 'Redirecionando...' : 'Conectar Meta Ads'}
              </button>
            )}
            {!loading && metaConectado && (
              <div className="flex gap-2 w-full">
                <button onClick={conectarMeta} disabled={conectando}
                  className="flex-1 py-2 bg-blue-900 text-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                  {conectando ? 'Redirecionando...' : 'Reconectar'}
                </button>
                <button onClick={desconectarMeta}
                  className="flex items-center gap-1 px-3 py-2 bg-red-900 border border-red-800 text-red-300 rounded-lg text-xs font-semibold hover:bg-red-800 transition">
                  <Trash2 size={12} /> Desconectar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-900 rounded-lg flex items-center justify-center">
                <span className="text-pink-300 font-bold text-xs">TT</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">TikTok Ads</div>
                <div className="text-gray-500 text-xs">TikTok Ads Manager</div>
              </div>
            </div>
            <Circle size={18} className="text-gray-600" />
          </div>
          <p className="text-gray-400 text-xs mb-4">Importe dados de campanhas do TikTok Ads Manager.</p>
          <button disabled className="w-full py-2 bg-gray-700 text-gray-500 rounded-lg text-xs font-semibold cursor-not-allowed">Em breve</button>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center">
                <span className="text-green-300 font-bold text-xs">G</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Google Ads</div>
                <div className="text-gray-500 text-xs">Google Ads Manager</div>
              </div>
            </div>
            <Circle size={18} className="text-gray-600" />
          </div>
          <p className="text-gray-400 text-xs mb-4">Importe gastos e conversoes do Google Ads.</p>
          <button disabled className="w-full py-2 bg-gray-700 text-gray-500 rounded-lg text-xs font-semibold cursor-not-allowed">Em breve</button>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-900 rounded-lg flex items-center justify-center">
                <span className="text-amber-300 font-bold text-xs">K</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Kwai Ads</div>
                <div className="text-gray-500 text-xs">Kwai for Business</div>
              </div>
            </div>
            <Circle size={18} className="text-gray-600" />
          </div>
          <p className="text-gray-400 text-xs mb-4">Importe dados de campanhas do Kwai.</p>
          <button disabled className="w-full py-2 bg-gray-700 text-gray-500 rounded-lg text-xs font-semibold cursor-not-allowed">Em breve</button>
        </div>
      </div>
    </div>
  );
}
