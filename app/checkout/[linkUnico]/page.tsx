'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';

export default function CheckoutPlanoPage({ params }: { params: Promise<{ linkUnico: string }> }) {
  const router = useRouter();
  const [linkUnico, setLinkUnico] = useState('');
  const [plano, setPlano] = useState<any>(null);
  const [produto, setProduto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [etapa, setEtapa] = useState(1);
  const [tempoRestante, setTempoRestante] = useState(0);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    metodoPagamento: ''
  });

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setLinkUnico(resolvedParams.linkUnico);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!linkUnico) return;
    carregarPlano();
  }, [linkUnico]);

  const carregarPlano = async () => {
    try {
      const res = await fetch(`/api/checkout/${linkUnico}`);
      if (res.ok) {
        const data = await res.json();
        setPlano(data.plano);
        setProduto(data.produto);
        
        if (data.plano.checkoutCronometro && data.plano.checkoutTempoMinutos) {
          setTempoRestante(data.plano.checkoutTempoMinutos * 60);
        }
      } else {
        alert('Plano não encontrado');
        router.push('/');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao carregar checkout');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tempoRestante > 0) {
      const timer = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            alert('⏰ Tempo esgotado! A oferta expirou.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [tempoRestante]);

 useEffect(() => {
    if (plano?.checkoutProvaSocial && plano?.checkoutIntervaloPop) {
      const nomesHomens = ['João', 'Pedro', 'Carlos', 'Lucas', 'Rafael', 'Fernando', 'Bruno', 'Gustavo', 'Rodrigo', 'Marcelo'];
      const nomesMulheres = ['Maria', 'Ana', 'Julia', 'Fernanda', 'Beatriz', 'Camila', 'Amanda', 'Letícia', 'Gabriela', 'Mariana'];
      const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba', 'Porto Alegre', 'Salvador', 'Fortaleza'];
      
      let nomes = [];
      if (plano.checkoutProvaSocialGenero === 'HOMENS') {
        nomes = nomesHomens;
      } else if (plano.checkoutProvaSocialGenero === 'MULHERES') {
        nomes = nomesMulheres;
      } else {
        nomes = [...nomesHomens, ...nomesMulheres];
      }
      
      const intervalo = setInterval(() => {
        const nome = nomes[Math.floor(Math.random() * nomes.length)];
        const cidade = cidades[Math.floor(Math.random() * cidades.length)];
        const minutos = Math.floor(Math.random() * 30) + 1;
        
        const popup = document.createElement('div');
        popup.className = 'fixed bottom-4 right-4 bg-white border-2 border-green-500 rounded-xl p-4 shadow-2xl z-50 animate-slide-up';
        popup.innerHTML = `
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div>
              <div class="font-bold text-gray-900">${nome} de ${cidade}</div>
              <div class="text-sm text-gray-600">Acabou de comprar há ${minutos} minutos</div>
            </div>
          </div>
        `;
        document.body.appendChild(popup);
        
        setTimeout(() => {
          popup.style.opacity = '0';
          popup.style.transform = 'translateY(100px)';
          setTimeout(() => popup.remove(), 300);
        }, 5000);
      }, (plano.checkoutIntervaloPop || 8) * 1000);
      
      return () => clearInterval(intervalo);
    }
  }, [plano]);

  const formatarTelefone = (valor: string) => {
    const nums = valor.replace(/\D/g, '');
    if (nums.length <= 10) return nums.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    return nums.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const formatarCPF = (valor: string) => {
    return valor.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const buscarCEP = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData({
          ...formData,
          rua: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const avancarEtapa = () => {
    if (etapa === 1) {
      if (!formData.nome || !formData.email || !formData.telefone) {
        alert('Preencha todos os campos obrigatórios!');
        return;
      }
      if (plano?.checkoutCpfObrigatorio && !formData.cpf) {
        alert('CPF é obrigatório!');
        return;
      }
    }
    
    if (etapa === 2 && plano?.checkoutPedirEndereco) {
      if (!formData.cep || !formData.rua || !formData.numero || !formData.bairro || !formData.cidade || !formData.estado) {
        alert('Preencha todos os campos do endereço!');
        return;
      }
    }
    
    setEtapa(etapa + 1);
  };

const finalizarPedido = async () => {
    if (!formData.metodoPagamento) {
      alert('Selecione um método de pagamento!');
      return;
    }
    
    try {
      const res = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planoId: plano.id,
          compradorNome: formData.nome,
          compradorEmail: formData.email,
          compradorCpf: formData.cpf,
          compradorTel: formData.telefone,
          cep: formData.cep,
          rua: formData.rua,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          metodoPagamento: formData.metodoPagamento
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Disparar pixels de conversão
        try {
          const { dispararPixelsProduto } = await import('@/lib/pixels');
          
          // Disparar evento de checkout
          await dispararPixelsProduto(
            produto.id,
            'CHECKOUT',
            formData.metodoPagamento === 'PIX' ? 'PIX' : 
            formData.metodoPagamento === 'BOLETO' ? 'BOLETO' : 'PIX',
            {
              email: formData.email,
              telefone: formData.telefone,
              nome: formData.nome,
              cidade: formData.cidade,
              estado: formData.estado,
              cep: formData.cep,
              valor: plano.preco,
              produtoNome: plano.nome
            }
          );
        } catch (pixelError) {
          console.error('Erro ao disparar pixels:', pixelError);
        }
        
        router.push(`/pedido/${data.vendaId}`);
      } else {
        const error = await res.json();
        alert(`❌ Erro: ${error.error || 'Erro ao finalizar pedido'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao processar pagamento');
    }
  };
  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-purple-600 text-xl">Carregando...</div></div>;
  if (!plano || !produto) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-900">Plano não encontrado</div></div>;

  const corPrimaria = plano.checkoutCorPrimaria || '#9333ea';
  const corSecundaria = plano.checkoutCorSecundaria || '#a855f7';

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(100px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
          transition: opacity 0.3s, transform 0.3s;
        }
      `}</style>

      {plano.checkoutBanner && (
  <div className="w-full bg-gray-100">
    <img src={plano.checkoutBanner} alt="Banner" className="w-full h-auto max-h-96 object-contain" />
  </div>
)}

      {plano.checkoutLogoSuperior && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <img src={plano.checkoutLogoSuperior} alt="Logo" className="h-16 md:h-20 object-contain mx-auto" />
        </div>
      )}

      {plano.checkoutCronometro && tempoRestante > 0 && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 text-center">
            <div className="text-red-600 font-bold text-lg mb-1">
              {plano.checkoutMensagemUrgencia || '⏰ Oferta expira em:'}
            </div>
            <div className="text-3xl font-bold text-red-600">{formatarTempo(tempoRestante)}</div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
              <div className="flex items-center justify-between mb-8">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${etapa >= num ? 'text-white' : 'bg-gray-200 text-gray-500'}`} style={etapa >= num ? { backgroundColor: corPrimaria } : {}}>
                      {etapa > num ? <Check size={20} /> : num}
                    </div>
                    {num < 3 && <div className={`w-20 h-1 mx-2 ${etapa > num ? '' : 'bg-gray-200'}`} style={etapa > num ? { backgroundColor: corPrimaria } : {}} />}
                  </div>
                ))}
              </div>

              {etapa === 1 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Dados Pessoais</h2>
                  <input type="text" placeholder="Nome Completo *" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 outline-none text-gray-900" />
                  <input type="email" placeholder="Email *" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 outline-none text-gray-900" />
                  <input type="text" placeholder="Telefone *" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: formatarTelefone(e.target.value)})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 outline-none text-gray-900" />
                  {plano.checkoutCpfObrigatorio && (
                    <input type="text" placeholder="CPF *" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: formatarCPF(e.target.value)})} maxLength={14} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 outline-none text-gray-900" />
                  )}
                  <button onClick={avancarEtapa} className="w-full py-4 text-white rounded-lg font-bold text-lg hover:opacity-90 transition" style={{ backgroundColor: corPrimaria }}>
                    Continuar →
                  </button>
                </div>
              )}

              {etapa === 2 && plano.checkoutPedirEndereco && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">📍 Endereço de Entrega</h2>
                  <div className="flex gap-2">
                    <input type="text" placeholder="CEP *" value={formData.cep} onChange={(e) => setFormData({...formData, cep: e.target.value})} className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900" />
                    <button onClick={buscarCEP} className="px-6 py-3 text-white rounded-lg font-semibold" style={{ backgroundColor: corPrimaria }}>Buscar</button>
                  </div>
                  <input type="text" placeholder="Rua *" value={formData.rua} onChange={(e) => setFormData({...formData, rua: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Número *" value={formData.numero} onChange={(e) => setFormData({...formData, numero: e.target.value})} className="px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900" />
                    <input type="text" placeholder="Complemento" value={formData.complemento} onChange={(e) => setFormData({...formData, complemento: e.target.value})} className="px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <input type="text" placeholder="Bairro *" value={formData.bairro} onChange={(e) => setFormData({...formData, bairro: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Cidade *" value={formData.cidade} onChange={(e) => setFormData({...formData, cidade: e.target.value})} className="px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900" />
                    <input type="text" placeholder="Estado *" value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} className="px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setEtapa(1)} className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-bold">← Voltar</button>
                    <button onClick={avancarEtapa} className="flex-1 py-4 text-white rounded-lg font-bold" style={{ backgroundColor: corPrimaria }}>Continuar →</button>
                  </div>
                </div>
              )}

              {etapa === 2 && !plano.checkoutPedirEndereco && setEtapa(3)}

              {etapa === 3 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">💳 Pagamento</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {plano.checkoutAceitaPix && (
                      <button onClick={() => setFormData({...formData, metodoPagamento: 'PIX'})} className={`p-6 border-2 rounded-xl text-center transition ${formData.metodoPagamento === 'PIX' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}>
                        <svg className="w-16 h-16 mx-auto mb-3" viewBox="0 0 512 512" fill="currentColor">
                          <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.1 231.1 518.1 200.8 488.6L103.3 391.5H112.6C132.6 391.5 151.5 383.7 165.7 369.5L242.4 292.5zM262.5 218.9C257.1 224.3 247.8 224.3 242.4 218.9L165.7 142.1C151.5 127.9 132.6 120.1 112.6 120.1H103.3L200.7 23.4C231.1-6.15 280.3-6.15 310.6 23.4L407.7 120.1H392.6C372.6 120.1 353.7 127.9 339.5 142.1L262.5 218.9zM112.6 142.7C126.4 142.7 139.1 148.3 149.7 158.1L226.4 234.8C233.6 241.1 243 245.6 252.5 245.6C261.9 245.6 271.3 241.1 278.5 234.8L355.5 157.8C365.3 148.1 378.8 142.5 392.6 142.5H430.3L488.6 200.8C518.9 231.1 518.9 280.3 488.6 310.6L430.3 368.9H392.6C378.8 368.9 365.3 363.3 355.5 353.5L278.5 276.5C271.3 270.1 261.9 265.6 252.5 265.6C243 265.6 233.6 270.1 226.4 276.5L149.7 353.2C139.1 363 126.4 368.6 112.6 368.6H80.78L23.4 310.6C-6.15 280.3-6.15 231.1 23.4 200.8L80.78 142.5L112.6 142.7z"/>
                        </svg>
                        <div className="font-bold text-lg">PIX</div>
                      </button>
                    )}
                  
                    {plano.checkoutAceitaCartao && (
                      <button onClick={() => setFormData({...formData, metodoPagamento: 'CARTAO'})} className={`p-6 border-2 rounded-xl text-center transition ${formData.metodoPagamento === 'CARTAO' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                        <div className="text-4xl mb-2">💳</div>
                        <div className="font-bold">Cartão</div>
                        <div className="text-sm text-gray-600">Crédito ou Débito</div>
                      </button>
                    )}
                    {plano.checkoutAceitaBoleto && (
                      <button onClick={() => setFormData({...formData, metodoPagamento: 'BOLETO'})} className={`p-6 border-2 rounded-xl text-center transition ${formData.metodoPagamento === 'BOLETO' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'}`}>
                        <div className="text-4xl mb-2">📄</div>
                        <div className="font-bold">Boleto</div>
                        <div className="text-sm text-gray-600">Vence em 3 dias</div>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3 pt-6">
                    <button onClick={() => setEtapa(plano.checkoutPedirEndereco ? 2 : 1)} className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-bold">← Voltar</button>
                    <button onClick={finalizarPedido} className="flex-1 py-4 text-white rounded-lg font-bold text-lg" style={{ backgroundColor: corPrimaria }}>🔒 Finalizar Pedido</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
              <h3 className="font-bold text-lg mb-4">📦 Resumo do Pedido</h3>
              {produto.imagem && <img src={produto.imagem} alt={produto.nome} className="w-full h-48 object-cover rounded-lg mb-4" />}
              <h4 className="font-bold text-gray-900 text-xl mb-2">{plano.nome}</h4>
              <p className="text-gray-600 text-sm mb-4">{produto.descricao}</p>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">R$ {plano.preco.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold" style={{ color: corPrimaria }}>
                  <span>Total:</span>
                  <span>R$ {plano.preco.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {plano.checkoutLogoInferior && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <img src={plano.checkoutLogoInferior} alt="Logo" className="h-16 md:h-20 object-contain mx-auto opacity-50" />
        </div>
      )}
    </div>
  );
}





