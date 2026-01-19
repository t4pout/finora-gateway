'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Clock } from 'lucide-react';

export default function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [pedidoId, setPedidoId] = useState('');
  const [venda, setVenda] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [verificando, setVerificando] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
            <Clock size={40} className="text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⏳ Aguardando Pagamento
          </h1>
          <p className="text-gray-600">
            Pedido #{venda?.id?.substring(0, 8) || 'Carregando...'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            📱 Escaneie o QR Code para pagar
          </h2>

          {venda?.pixQrCode && (
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-xl border-4 border-purple-600">
                <img 
                  src={venda.pixQrCode.startsWith('data:') ? venda.pixQrCode : `data:image/png;base64,${venda.pixQrCode}`}
                  alt="QR Code PIX" 
                  className="w-64 h-64 object-contain"
                />
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Ou copie o código PIX:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={venda?.pixCopiaECola || ''}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg font-mono text-sm text-gray-900"
              />
              <button
                onClick={copiarPix}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center space-x-2"
              >
                <Copy size={20} />
                <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-4">
            <div className="font-semibold text-blue-900 mb-2">📋 Como pagar:</div>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Abra o app do seu banco</li>
              <li>Escolha pagar com PIX</li>
              <li>Escaneie o QR Code ou cole o código</li>
              <li>Confirme o pagamento</li>
              <li>Pronto! A confirmação é automática</li>
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
          <h3 className="font-bold text-lg mb-4">📦 Resumo do Pedido</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-semibold text-gray-900">{venda?.compradorNome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-semibold text-gray-900">{venda?.compradorEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Método:</span>
              <span className="font-semibold text-gray-900">PIX</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-gray-900 font-bold">Total:</span>
              <span className="text-2xl font-bold text-purple-600">
                R$ {venda?.valor?.toFixed(2).replace('.', ',') || '0,00'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-600">
          {verificando ? '🔄 Verificando pagamento...' : '⏱️ Aguardando confirmação automática'}
        </div>
      </div>
    </div>
  );
}