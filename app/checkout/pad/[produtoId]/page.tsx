// Force deploy - PAD enabled
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Package } from 'lucide-react';

export default function CheckoutPADPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [produto, setProduto] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const [formData, setFormData] = useState({
    clienteNome: '',
    clienteCpfCnpj: '',
    clienteTelefone: '',
    clienteEmail: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  useEffect(() => {
    carregarProduto();
  }, []);

  const carregarProduto = async () => {
    try {
      const response = await fetch(`/api/produtos/${params.produtoId}`);
      if (response.ok) {
        const data = await response.json();
        if (!data.produto.padHabilitado) {
          setErro('Este produto não aceita pedidos PAD');
          return;
        }
        setProduto(data.produto);
      } else {
        setErro('Produto não encontrado');
      }
    } catch (error) {
      setErro('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const buscarCep = async () => {
    if (formData.cep.length !== 8) return;
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${formData.cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          rua: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro('');

    try {
      const response = await fetch('/api/pad/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          produtoId: params.produtoId,
          produtoNome: produto.nome,
          produtoImagem: produto.imagem,
          valor: produto.preco
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso(true);
      } else {
        setErro(data.error || 'Erro ao enviar pedido');
      }
    } catch (error) {
      setErro('Erro ao conectar com servidor');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-purple-600 text-xl">Carregando...</div>
      </div>
    );
  }

  if (erro && !produto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{erro}</div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pedido Enviado!
          </h1>
          <p className="text-gray-600 mb-6">
            Seu pedido foi recebido e está em análise. Você receberá um contato em breve via WhatsApp.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>CPF/CNPJ:</strong> {formData.clienteCpfCnpj}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Guarde este documento para consultar seu pedido
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📦 PAGAMENTO 100% SEGURO
              </h1>
              <p className="text-gray-600 mb-8">
                Para localizar o seu pedido e prosseguir com o pagamento, preencha as informações solicitadas abaixo, como o documento e o endereço de entrega utilizados na compra.
              </p>

              {erro && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Identificação */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mr-3">1</span>
                    Identificação
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nome Completo *"
                      value={formData.clienteNome}
                      onChange={(e) => setFormData({...formData, clienteNome: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="CPF ou CNPJ *"
                      value={formData.clienteCpfCnpj}
                      onChange={(e) => setFormData({...formData, clienteCpfCnpj: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <input
                      type="tel"
                      placeholder="Telefone/WhatsApp *"
                      value={formData.clienteTelefone}
                      onChange={(e) => setFormData({...formData, clienteTelefone: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <input
                      type="email"
                      placeholder="E-mail"
                      value={formData.clienteEmail}
                      onChange={(e) => setFormData({...formData, clienteEmail: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mr-3">2</span>
                    Endereço
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="CEP *"
                      maxLength={8}
                      value={formData.cep}
                      onChange={(e) => setFormData({...formData, cep: e.target.value.replace(/\D/g, '')})}
                      onBlur={buscarCep}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="Rua *"
                      value={formData.rua}
                      onChange={(e) => setFormData({...formData, rua: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Número *"
                        value={formData.numero}
                        onChange={(e) => setFormData({...formData, numero: e.target.value})}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                      />
                      <input
                        type="text"
                        placeholder="Complemento"
                        value={formData.complemento}
                        onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Bairro *"
                      value={formData.bairro}
                      onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Cidade *"
                        value={formData.cidade}
                        onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                      />
                      <input
                        type="text"
                        placeholder="Estado *"
                        maxLength={2}
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value.toUpperCase()})}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                >
                  {enviando ? 'ENVIANDO...' : 'CONFIRMAR PEDIDO'}
                </button>
              </form>
            </div>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📦 Resumo do Pedido</h3>
              
              {produto?.imagem && (
                <img 
                  src={produto.imagem} 
                  alt={produto.nome}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-gray-900">{produto?.nome}</div>
                  <div className="text-sm text-gray-600">{produto?.descricao}</div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">R$ {produto?.preco.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-purple-600">R$ {produto?.preco.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="text-green-600 font-bold">✓</div>
                  <div className="text-sm text-green-800">
                    <strong>Pagamento Após Entrega</strong>
                    <p className="text-xs mt-1">
                      Você só paga depois de receber o produto!
                    </p>
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