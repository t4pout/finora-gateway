'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Package, CreditCard, Copy, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import QRCode from 'qrcode';

export default function PagarPedidoPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gerandoPix, setGerandoPix] = useState(false);
  const [pedido, setPedido] = useState<any>(null);
  const [pixGerado, setPixGerado] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarPedido();
  }, []);

  const carregarPedido = async () => {
    try {
      const response = await fetch(`/api/pad/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.pedido.pixQrCode && data.pedido.pixCopiaECola) {
          setPedido(data.pedido);
          setPixGerado(true);
          gerarQRCode(data.pedido.pixQrCode);
        } else {
          setPedido(data.pedido);
        }
      } else {
        setErro('Pedido não encontrado');
      }
    } catch (error) {
      setErro('Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  };

  const gerarQRCode = async (pixCode: string) => {
    try {
      const url = await QRCode.toDataURL(pixCode, {
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  };

  const gerarPix = async () => {
    setGerandoPix(true);
    setErro('');

    try {
      const response = await fetch(`/api/pad/${params.id}/gerar-pix`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        setPedido(data.pedido);
        setPixGerado(true);
        gerarQRCode(data.pedido.pixQrCode);
      } else {
        setErro(data.error || 'Erro ao gerar PIX');
      }
    } catch (error) {
      setErro('Erro ao conectar com servidor');
    } finally {
      setGerandoPix(false);
    }
  };

  const copiarCodigo = () => {
    if (pedido?.pixCopiaECola) {
      navigator.clipboard.writeText(pedido.pixCopiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-purple-600 text-xl">Carregando...</div>
      </div>
    );
  }

  if (erro || !pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{erro}</div>
          <button
            onClick={() => router.push('/pad/buscar')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Voltar para busca
          </button>
        </div>
      </div>
    );
  }

  if (pedido.status === 'PAGO') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento Confirmado!
          </h1>
          <p className="text-gray-600 mb-6">
            Seu pagamento foi aprovado com sucesso.
          </p>
          <button
            onClick={() => router.push('/pad/buscar')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Ver meus pedidos
          </button>
        </div>
      </div>
    );
  }

  if (pedido.status !== 'APROVADO' && pedido.status !== 'ENVIADO') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pedido em Análise
          </h1>
          <p className="text-gray-600 mb-6">
            Seu pedido ainda está sendo analisado. Você receberá um contato em breve.
          </p>
          <button
            onClick={() => router.push('/pad/buscar')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                💳 Pagamento via PIX
              </h1>
              <p className="text-gray-600 mb-8">
                Escaneie o QR Code ou copie o código para pagar
              </p>

              {!pixGerado ? (
                <div className="text-center py-12">
                  {erro && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      {erro}
                    </div>
                  )}
                  
                  <button
                    onClick={gerarPix}
                    disabled={gerandoPix}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 transition shadow-lg"
                  >
                    {gerandoPix ? 'GERANDO PIX...' : 'GERAR PIX PARA PAGAMENTO'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    {qrCodeUrl && (
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code PIX"
                        className="w-72 h-72 border-4 border-gray-200 rounded-lg shadow-lg"
                      />
                    )}
                    <p className="text-sm text-gray-600 mt-4">
                      Escaneie o QR Code com o app do seu banco
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ou copie o código PIX:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pedido.pixCopiaECola}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-900"
                      />
                      <button
                        onClick={copiarCodigo}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                          copiado 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {copiado ? (
                          <>
                            <CheckCircle className="inline w-5 h-5 mr-2" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="inline w-5 h-5 mr-2" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Instruções:</strong>
                    </p>
                    <ol className="list-decimal ml-5 mt-2 text-sm text-blue-700 space-y-1">
                      <li>Abra o app do seu banco</li>
                      <li>Escolha pagar com PIX</li>
                      <li>Escaneie o QR Code ou cole o código</li>
                      <li>Confirme o pagamento</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📦 Resumo do Pedido</h3>
              
              {pedido.produtoImagem && (
                <img 
                  src={pedido.produtoImagem} 
                  alt={pedido.produtoNome}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-gray-900">{pedido.produtoNome}</div>
                  <div className="text-sm text-gray-600">Pedido #{pedido.hash}</div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-green-600">R$ {pedido.valor.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  <strong>Endereço:</strong><br />
                  {pedido.rua}, {pedido.numero}<br />
                  {pedido.cidade}/{pedido.estado}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}