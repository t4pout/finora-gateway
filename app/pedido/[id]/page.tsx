'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, FileText, MessageCircle, Mail, Pencil } from 'lucide-react';

const SUPORTE_WHATSAPP = '+55 33 93300-4029';
const SUPORTE_EMAIL = 'sac@finorapayments.com';
const TEMPO_LIMITE_SEGUNDOS = 30 * 60; // 30 minutos, visual (nao bloqueia o pagamento real)

export default function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [pedidoId, setPedidoId] = useState('');
  const [venda, setVenda] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(TEMPO_LIMITE_SEGUNDOS);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setPedidoId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!pedidoId) return;
    carregarPedido();

    const interval = setInterval(verificarPagamento, 5000);
    return () => clearInterval(interval);
  }, [pedidoId]);

  useEffect(() => {
    if (!venda?.createdAt) return;
    const calcularRestante = () => {
      const criadoEm = new Date(venda.createdAt).getTime();
      const passados = Math.floor((Date.now() - criadoEm) / 1000);
      setTempoRestante(Math.max(0, TEMPO_LIMITE_SEGUNDOS - passados));
    };
    calcularRestante();
    const timer = setInterval(calcularRestante, 1000);
    return () => clearInterval(timer);
  }, [venda?.createdAt]);

  const carregarPedido = async () => {
    try {
      const res = await fetch(`/api/pedido/${pedidoId}`);
      if (res.ok) {
        const data = await res.json();

        if (data.venda.status === 'PAGO' || data.venda.status === 'APROVADO') {
          router.push(`/pagamento/sucesso?pedido=${pedidoId}`);
          return;
        }

        setVenda(data.venda);
      } else {
        alert('Pedido não encontrado');
        router.push('/');
      }
    } catch (error) {
      console.error('Erro:', error);
    }
    setLoading(false);
  };

  const verificarPagamento = async () => {
    if (verificando || !pedidoId) return;
    setVerificando(true);

    try {
      const res = await fetch(`/api/pedido/${pedidoId}/verificar`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'PAGO') {
          router.push(`/pagamento/sucesso?pedido=${pedidoId}`);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
    }

    setVerificando(false);
  };

  const copiarPix = () => {
    if (venda?.pixCopiaECola) {
      navigator.clipboard.writeText(venda.pixCopiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const formatarTempo = (segundos: number) => {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Carregando pedido...</div>
      </div>
    );
  }

  if (!venda) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900">Pedido não encontrado</div>
      </div>
    );
  }

  const isPix = venda.metodoPagamento === 'PIX';
  const isBoleto = venda.metodoPagamento === 'BOLETO';
  const progressoTempo = Math.max(0, Math.min(100, (tempoRestante / TEMPO_LIMITE_SEGUNDOS) * 100));
  const enderecoCompleto = venda.rua ? `${venda.rua}, ${venda.numero || 's/n'}${venda.complemento ? ' - ' + venda.complemento : ''}, ${venda.bairro || ''}, ${venda.cidade || ''}/${venda.estado || ''}, ${venda.cep || ''}` : null;

  const itens = [
    { nome: venda.produto?.nome, imagem: venda.produto?.imagem, qtd: venda.quantidade || 1, tag: venda.produto?.tipo },
    ...(venda.orderBumpsNomes || []).map((nome: string) => ({ nome, imagem: null, qtd: 1, tag: null }))
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_360px] gap-6 items-start">

        {/* COLUNA ESQUERDA */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {isPix ? 'PIX aguardando confirmação' : isBoleto ? 'Boleto aguardando pagamento' : 'Aguardando pagamento'}
            </h1>
            <button onClick={verificarPagamento} disabled={verificando} className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition disabled:opacity-50">
              {verificando ? 'Verificando...' : 'Atualizar status'}
            </button>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            {isPix ? 'Copie o código Pix ou escaneie o QR Code para concluir o pagamento agora.' : 'Abra o boleto e pague em qualquer banco até o vencimento.'}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 text-white text-sm">•••</div>
            <div>
              <div className="font-bold text-amber-900 text-sm">Aguardando seu pagamento</div>
              <div className="text-amber-700 text-sm">Seu pedido está reservado. Conclua o pagamento para finalizar.</div>
            </div>
          </div>

          {isPix && (
            <>
              <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  Tempo para pagar
                </div>
                <div className="text-xl font-bold text-orange-600">{formatarTempo(tempoRestante)}</div>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full -mt-5 mb-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all" style={{ width: `${progressoTempo}%` }}></div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  {venda.pixQrCode ? (
                    <img src={venda.pixQrCode.startsWith('data:') ? venda.pixQrCode : `data:image/png;base64,${venda.pixQrCode}`} alt="QR Code PIX" className="w-40 h-40 object-contain bg-white rounded-lg border border-gray-200 flex-shrink-0" />
                  ) : venda.pixCopiaECola ? (
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(venda.pixCopiaECola)}`} alt="QR Code PIX" className="w-40 h-40 object-contain bg-white rounded-lg border border-gray-200 flex-shrink-0" />
                  ) : null}
                  <div className="flex-1 w-full">
                    <div className="text-xs font-bold text-gray-500 mb-2 tracking-wide">PIX COPIA E COLA</div>
                    <div className="text-xs text-gray-600 font-mono break-all bg-white border border-gray-200 rounded-lg p-3 mb-3 max-h-24 overflow-y-auto">
                      {venda?.pixCopiaECola || ''}
                    </div>
                    <button onClick={copiarPix} className="w-full px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition">
                      <Copy size={16} />
                      {copiado ? 'Copiado!' : 'Copiar código Pix'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-500 mb-3 tracking-wide">O QUE ACONTECE AGORA?</div>
                <div className="space-y-3">
                  {[
                    'Escaneie o QR Code ou copie o código acima no app do seu banco.',
                    'Acesse "Pix copia e cola" no banco e cole o código para pagar.',
                    'Esta página se atualiza automaticamente após a confirmação.'
                  ].map((texto, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                      <p className="text-sm text-gray-600">{texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {isBoleto && (
            <div>
              {venda.boletoUrl ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 text-center">
                  <FileText size={56} className="text-green-600 mx-auto mb-3" />
                  <p className="font-bold text-green-900 mb-4">Seu boleto está pronto!</p>
                  <a href={venda.boletoUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition">
                    Abrir Boleto (PDF)
                  </a>
                  {venda.boletoBarcode && (
                    <div className="mt-4 text-left">
                      <p className="text-xs text-gray-600 mb-1">Código de barras:</p>
                      <p className="font-mono text-xs text-gray-800 break-all bg-white p-2 rounded border border-green-200">{venda.boletoBarcode}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 text-center">
                  <FileText size={56} className="text-yellow-600 mx-auto mb-2" />
                  <p className="font-bold text-yellow-900">Gerando seu boleto...</p>
                  <p className="text-sm text-yellow-700 mt-1">Aguarde alguns instantes, a página atualiza sozinha.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-yellow-400 to-gray-900"></div>
            <div className="p-5">
              <div className="text-xs font-bold text-gray-500 mb-3 tracking-wide">🛒 TUDO QUE VOCÊ VAI LEVAR</div>
              <div className="space-y-3 mb-4">
                {itens.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center text-xs font-bold text-yellow-800 flex-shrink-0 overflow-hidden">
                      {item.imagem ? <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover" /> : `${item.qtd}${i === 0 ? 'A' : ''}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{item.nome} x{item.qtd}</div>
                    </div>
                    {item.tag && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase flex-shrink-0">{item.tag}</span>}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                    ● {isPix ? 'PIX AGUARDANDO' : isBoleto ? 'BOLETO AGUARDANDO' : 'AGUARDANDO'}
                  </span>
                </div>
                {enderecoCompleto && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-gray-500 flex-shrink-0">Endereço</span>
                    <span className="text-gray-900 text-right text-xs leading-relaxed">{enderecoCompleto}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Método</span>
                  <span className="text-gray-900 font-semibold">{venda.metodoPagamento}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Data</span>
                  <span className="text-gray-900">{venda?.createdAt ? new Date(venda.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 tracking-wide">TOTAL</span>
                <span className="text-xl font-bold text-gray-900">R$ {venda?.valor?.toFixed(2).replace('.', ',') || '0,00'}</span>
              </div>

              {isPix && venda?.pixCopiaECola && (
                <button onClick={copiarPix} className="w-full mt-4 px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition">
                  <Copy size={16} />
                  {copiado ? 'Copiado!' : 'Copiar código Pix'}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-sm text-gray-500 mb-3">Precisa de ajuda com o pedido?</p>
            <div className="space-y-2 text-sm">
              <a href={`https://wa.me/${SUPORTE_WHATSAPP.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-green-600 font-semibold hover:underline">
                <MessageCircle size={16} />
                {SUPORTE_WHATSAPP}
              </a>
              <a href={`mailto:${SUPORTE_EMAIL}`} className="flex items-center justify-center gap-2 text-blue-600 hover:underline">
                <Mail size={16} />
                {SUPORTE_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}