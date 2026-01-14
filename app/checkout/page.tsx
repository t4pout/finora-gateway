'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Package, MapPin, CreditCard, Loader } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  imagem: string;
  descricao: string;
}

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const produtoId = searchParams.get('produto');
  const campanhaId = searchParams.get('camp');
  
  const [produto, setProduto] = useState<Produto | null>(null);
  const [etapa, setEtapa] = useState(1);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  // ETAPA 1: Dados Pessoais
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  
  // ETAPA 2: Endereço
  const [cep, setCep] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  
  // ETAPA 3: Pagamento
  const [metodoPagamento, setMetodoPagamento] = useState('PIX');

  useEffect(() => {
    if (!produtoId) {
      router.push('/');
      return;
    }
    carregarProduto();
  }, [produtoId]);

  const carregarProduto = async () => {
    try {
      const response = await fetch(`/api/produtos/${produtoId}`);
      if (response.ok) {
        const data = await response.json();
        setProduto(data.produto);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarCep = async () => {
    if (cep.replace(/\D/g, '').length !== 8) return;
    
    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setRua(data.logradouro);
        setBairro(data.bairro);
        setCidade(data.localidade);
        setEstado(data.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setBuscandoCep(false);
    }
  };

  const validarEtapa1 = () => {
    return nome && email && telefone && cpf.replace(/\D/g, '').length === 11;
  };

  const validarEtapa2 = () => {
    return cep && rua && numero && bairro && cidade && estado;
  };

  const handleFinalizarPedido = async () => {
    setEnviando(true);
    
    try {
      const response = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoId,
          vendedorId: (produto as any)?.userId || produtoId,
          valor: produto?.preco.toString(),
          metodoPagamento,
          compradorNome: nome,
          compradorEmail: email,
          compradorTel: telefone,
          compradorCpf: cpf,
          cep,
          rua,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          campanhaId
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Pedido realizado com sucesso!');
        router.push('/');
      } else {
        alert('Erro ao finalizar pedido');
      }
    } catch (error) {
      alert('Erro ao processar pedido');
    } finally {
      setEnviando(false);
    }
  };

  const formatarCPF = (valor: string) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatarCEP = (valor: string) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const formatarTelefone = (valor: string) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="animate-spin text-purple-600" size={48} />
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Produto não encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push('/')} className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition mb-4">
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>
          
          <div className="flex items-center justify-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl"></div>
            <h1 className="text-2xl font-bold text-gray-900">Finora Checkout</h1>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                  etapa >= step 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {etapa > step ? <Check size={20} /> : step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-2 transition ${
                    etapa > step ? 'bg-purple-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm font-medium text-gray-600">Dados Pessoais</span>
            <span className="text-sm font-medium text-gray-600">Endereço</span>
            <span className="text-sm font-medium text-gray-600">Pagamento</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo do Pedido</h3>
              
              {produto.imagem ? (
                <img src={produto.imagem} alt={produto.nome} className="w-full h-48 object-cover rounded-xl mb-4" />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <Package size={48} className="text-white" />
                </div>
              )}

              <h4 className="font-bold text-gray-900 mb-2">{produto.nome}</h4>
              <p className="text-sm text-gray-600 mb-4">{produto.descricao}</p>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Subtotal:</span>
                  <span>R$ {produto.preco.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between font-bold text-purple-600 text-xl">
                  <span>Total:</span>
                  <span>R$ {produto.preco.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              {/* ETAPA 1: Dados Pessoais */}
              {etapa === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Package size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Dados Pessoais</h2>
                      <p className="text-gray-600">Preencha seus dados para continuar</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Nome Completo *</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Telefone *</label>
                      <input
                        type="text"
                        value={telefone}
                        onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">CPF *</label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(formatarCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
                    />
                  </div>

                  <button
                    onClick={() => validarEtapa1() && setEtapa(2)}
                    disabled={!validarEtapa1()}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <span>Continuar para Endereço</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              )}

              {/* ETAPA 2: Endereço */}
              {etapa === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <MapPin size={24} className="text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Endereço de Entrega</h2>
                      <p className="text-gray-600">Para onde devemos enviar?</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">CEP *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => setCep(formatarCEP(e.target.value))}
                        placeholder="00000-000"
                        maxLength={9}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
                      />
                      <button
                        onClick={buscarCep}
                        disabled={buscandoCep}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        {buscandoCep ? 'Buscando...' : 'Buscar'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Endereço *</label>
                    <input
                      type="text"
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                      placeholder="Rua, Avenida..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Número *</label>
                      <input
                        type="text"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        placeholder="123"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Complemento</label>
                      <input
                        type="text"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        placeholder="Apto, Bloco..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Bairro *</label>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Centro"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Cidade *</label>
                      <input
                        type="text"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="São Paulo"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Estado *</label>
                      <input
                        type="text"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value.toUpperCase())}
                        placeholder="SP"
                        maxLength={2}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setEtapa(1)}
                      className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => validarEtapa2() && setEtapa(3)}
                      disabled={!validarEtapa2()}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <span>Continuar para Pagamento</span>
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 3: Pagamento */}
              {etapa === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Método de Pagamento</h2>
                      <p className="text-gray-600">Como você quer pagar?</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setMetodoPagamento('PIX')}
                      className={`p-6 border-2 rounded-xl transition ${
                        metodoPagamento === 'PIX'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">📱</div>
                      <div className="font-bold text-gray-900">PIX</div>
                      <div className="text-xs text-gray-600">Aprovação imediata</div>
                    </button>

                    <button
                      onClick={() => setMetodoPagamento('CARTAO')}
                      className={`p-6 border-2 rounded-xl transition ${
                        metodoPagamento === 'CARTAO'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">💳</div>
                      <div className="font-bold text-gray-900">Cartão</div>
                      <div className="text-xs text-gray-600">Crédito ou Débito</div>
                    </button>

                    <button
                      onClick={() => setMetodoPagamento('BOLETO')}
                      className={`p-6 border-2 rounded-xl transition ${
                        metodoPagamento === 'BOLETO'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">📄</div>
                      <div className="font-bold text-gray-900">Boleto</div>
                      <div className="text-xs text-gray-600">Vence em 3 dias</div>
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setEtapa(2)}
                      className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleFinalizarPedido}
                      disabled={enviando}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {enviando ? (
                        <>
                          <Loader className="animate-spin" size={20} />
                          <span>Processando...</span>
                        </>
                      ) : (
                        <>
                          <Check size={20} />
                          <span>Finalizar Pedido</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-purple-600 text-xl">Carregando...</div></div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}





