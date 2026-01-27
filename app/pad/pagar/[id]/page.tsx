'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Package, CreditCard, Smartphone, FileText, Lock } from 'lucide-react';

export default function CheckoutPagamentoPADPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [pedido, setPedido] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('PIX');
  const [pixGerado, setPixGerado] = useState(false);
  const [pagamentoAprovado, setPagamentoAprovado] = useState(false);

  // Dados do cartão
  const [dadosCartao, setDadosCartao] = useState({
    numero: '',
    nome: '',
    validade: '',
    cvv: '',
    parcelas: '1'
  });

  useEffect(() => {
    carregarPedido();
  }, []);

  const carregarPedido = async () => {
    try {
      const response = await fetch(`/api/pad/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.pedido.status === 'PAGO') {
          router.push(`/pad/detalhes/${params.id}`);
          return;
        }
        
        setPedido(data.pedido);
      } else {
        setErro('Pedido não encontrado');
      }
    } catch (error) {
      setErro('Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  };

  const finalizarPagamento = async () => {
  setProcessando(true);
  setErro('');

  try {
    // Validar cartão se for o método escolhido
    if (metodoPagamento === 'CARTAO') {
      if (!dadosCartao.numero || dadosCartao.numero.length < 13) {
        setErro('Número do cartão inválido');
        setProcessando(false);
        return;
      }
      if (!dadosCartao.nome || dadosCartao.nome.length < 3) {
        setErro('Nome do titular inválido');
        setProcessando(false);
        return;
      }
      if (!dadosCartao.validade || dadosCartao.validade.length < 5) {
        setErro('Validade inválida (use MM/AA)');
        setProcessando(false);
        return;
      }
      if (!dadosCartao.cvv || dadosCartao.cvv.length < 3) {
        setErro('CVV inválido');
        setProcessando(false);
        return;
      }
    }

    const response = await fetch(`/api/pad/${params.id}/processar-pagamento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metodoPagamento,
        dadosCartao: metodoPagamento === 'CARTAO' ? dadosCartao : null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setErro(data.error || 'Erro ao processar pagamento');
      return;
    }

    // Sucesso!
    if (metodoPagamento === 'PIX') {
      // Atualizar pedido com dados do PIX e mostrar QR Code
      setPixGerado(true);
      setPedido({...pedido, ...data.pedido});
    } else if (metodoPagamento === 'CARTAO') {
      if (data.status === 'APROVADO') {
        setPagamentoAprovado(true);
        setTimeout(() => {
          router.push(`/pad/confirmacao/${params.id}`);
        }, 2000);
      } else {
        setErro('Pagamento não aprovado. Verifique os dados do cartão.');
      }
    } else if (metodoPagamento === 'BOLETO') {
      if (data.boletoUrl) {
        window.open(data.boletoUrl, '_blank');
        setPagamentoAprovado(true);
        setTimeout(() => {
          router.push(`/pad/confirmacao/${params.id}`);
        }, 2000);
      }
    }
    
  } catch (error) {
    console.error('Erro:', error);
    setErro('Erro ao processar pagamento');
  } finally {
    setProcessando(false);
  }
};

      const data = await response.json();

      if (!response.ok) {
        setErro(data.error || 'Erro ao processar pagamento');
        return;
      }

      // Sucesso!
if (metodoPagamento === 'PIX') {
  // Atualizar pedido com dados do PIX e mostrar QR Code
  setPixGerado(true);
  setPedido({...pedido, ...data.pedido});
}
        else if (metodoPagamento === 'CARTAO') {
        if (data.status === 'APROVADO') {
          alert('✅ Pagamento aprovado com sucesso!');
          router.push(`/pad/detalhes/${params.id}`);
        } else {
          setErro('Pagamento não aprovado. Verifique os dados do cartão.');
        }
      } else if (metodoPagamento === 'BOLETO') {
        // Abrir boleto em nova aba
        if (data.boletoUrl) {
          window.open(data.boletoUrl, '_blank');
          alert('✅ Boleto gerado! Uma nova aba foi aberta.');
        }
      }
      
    } catch (error) {
      console.error('Erro:', error);
      setErro('Erro ao processar pagamento');
    } finally {
      setProcessando(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-green-600 text-white py-3 px-6 rounded-t-2xl text-center font-bold">
          💳 PAGAMENTO 100% SEGURO
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Dados do Cliente */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <h3 className="text-lg font-bold text-gray-900">Identificação</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Nome Completo</span>
                    <p className="font-medium text-gray-900">{pedido.clienteNome}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">CPF/CNPJ</span>
                    <p className="font-medium text-gray-900">{pedido.clienteCpfCnpj}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Telefone</span>
                    <p className="font-medium text-gray-900">{pedido.clienteTelefone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email</span>
                    <p className="font-medium text-gray-900">{pedido.clienteEmail || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <h3 className="text-lg font-bold text-gray-900">Endereço</h3>
              </div>
              
              <div className="text-sm text-gray-700">
                <p>{pedido.rua}, {pedido.numero}{pedido.complemento && ` - ${pedido.complemento}`}</p>
                <p>{pedido.bairro}</p>
                <p>{pedido.cidade}/{pedido.estado}</p>
                <p>CEP: {pedido.cep}</p>
              </div>
            </div>

            {/* Pagamento */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <h3 className="text-lg font-bold text-gray-900">Pagamento</h3>
              </div>

              <p className="text-sm text-gray-600 mb-4">Escolha o seu método de pagamento preferido:</p>

              {/* Métodos de Pagamento */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setMetodoPagamento('PIX')}
                  className={`w-full p-4 rounded-lg border-2 transition flex items-center space-x-3 ${
                    metodoPagamento === 'PIX' 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    metodoPagamento === 'PIX' ? 'border-purple-600' : 'border-gray-300'
                  }`}>
                    {metodoPagamento === 'PIX' && <div className="w-3 h-3 bg-purple-600 rounded-full" />}
                  </div>
                  <Smartphone className="w-6 h-6 text-purple-600" />
                  <span className="font-semibold text-gray-900">PIX</span>
                </button>

                <button
                  onClick={() => setMetodoPagamento('CARTAO')}
                  className={`w-full p-4 rounded-lg border-2 transition flex items-center space-x-3 ${
                    metodoPagamento === 'CARTAO' 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    metodoPagamento === 'CARTAO' ? 'border-purple-600' : 'border-gray-300'
                  }`}>
                    {metodoPagamento === 'CARTAO' && <div className="w-3 h-3 bg-purple-600 rounded-full" />}
                  </div>
                  <CreditCard className="w-6 h-6 text-purple-600" />
                  <span className="font-semibold text-gray-900">Cartão de Crédito</span>
                </button>

                <button
                  onClick={() => setMetodoPagamento('BOLETO')}
                  className={`w-full p-4 rounded-lg border-2 transition flex items-center space-x-3 ${
                    metodoPagamento === 'BOLETO' 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    metodoPagamento === 'BOLETO' ? 'border-purple-600' : 'border-gray-300'
                  }`}>
                    {metodoPagamento === 'BOLETO' && <div className="w-3 h-3 bg-purple-600 rounded-full" />}
                  </div>
                  <FileText className="w-6 h-6 text-purple-600" />
                  <span className="font-semibold text-gray-900">Boleto Bancário</span>
                </button>
              </div>

              {/* Formulário de Cartão */}
              {metodoPagamento === 'CARTAO' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    placeholder="Número do cartão"
                    value={dadosCartao.numero}
                    onChange={(e) => setDadosCartao({...dadosCartao, numero: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                    maxLength={19}
                  />
                  <input
                    type="text"
                    placeholder="Nome no Titular do cartão"
                    value={dadosCartao.nome}
                    onChange={(e) => setDadosCartao({...dadosCartao, nome: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="MM/AA"
                      value={dadosCartao.validade}
onChange={(e) => {
  let valor = e.target.value.replace(/\D/g, ''); // Remove não-numéricos
  if (valor.length >= 2) {
    valor = valor.slice(0, 2) + '/' + valor.slice(2, 4); // Adiciona /
  }
  setDadosCartao({...dadosCartao, validade: valor});
}}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                      maxLength={5}
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={dadosCartao.cvv}
                      onChange={(e) => setDadosCartao({...dadosCartao, cvv: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                      maxLength={4}
                    />
                    <select
                      value={dadosCartao.parcelas}
                      onChange={(e) => setDadosCartao({...dadosCartao, parcelas: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="1">1x</option>
                      <option value="2">2x</option>
                      <option value="3">3x</option>
                      <option value="4">4x</option>
                      <option value="5">5x</option>
                      <option value="6">6x</option>
                      <option value="7">7x</option>
                      <option value="8">8x</option>
                      <option value="9">9x</option>
                      <option value="10">10x</option>
                      <option value="11">11x</option>
                      <option value="12">12x</option>
                    </select>
                  </div>
                </div>
              )}

              {erro && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {erro}
                </div>
              )}
{/* QR Code PIX */}
{pixGerado && pedido.pixQrCode && (
  <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
    <h4 className="font-bold text-green-800 mb-4 text-center">✅ PIX Gerado com Sucesso!</h4>
    <div className="flex flex-col items-center space-y-4">
      <img 
        src={`data:image/png;base64,${pedido.pixQrCode}`}
        alt="QR Code PIX" 
        className="w-64 h-64"
      />
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ou copie o código PIX:
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={pedido.pixCopiaECola || ''}
            readOnly
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(pedido.pixCopiaECola);
              alert('✅ Código PIX copiado!');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            Copiar
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Botão Já Paguei PIX */}
{pixGerado && (
  <button
    onClick={() => {
      setPagamentoAprovado(true);
      setTimeout(() => {
        router.push(`/pad/confirmacao/${params.id}`);
      }, 1000);
    }}
    className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
  >
    ✅ Já realizei o pagamento
  </button>
)}

{/* Mensagem de sucesso */}
{pagamentoAprovado && (
  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
    ✅ Pagamento processado! Redirecionando...
  </div>
)}

<button
  onClick={finalizarPagamento}
  disabled={processando || pixGerado}
                disabled={processando}
                className="w-full mt-6 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
              >
                <Lock size={20} />
                <span>{processando ? 'PROCESSANDO...' : 'CONFIRMAR PEDIDO'}</span>
              </button>
            </div>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border sticky top-4">
              <h3 className="font-bold text-gray-900 mb-4">📦 Resumo do Pedido</h3>
              
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
                  <div className="text-sm text-gray-600">Quantidade: {pedido.quantidade}</div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">R$ {pedido.valor.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-green-600">R$ {pedido.valor.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                <div className="flex items-start space-x-2">
                  <div className="text-green-600">✓</div>
                  <div className="text-green-800">
                    <strong>Pagamento Após Entrega</strong>
                    <p className="text-xs mt-1">Produto já foi enviado para você!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}