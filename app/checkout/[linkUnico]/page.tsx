'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PlanoOferta {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  ativo: boolean;
  checkoutBanner?: string;
  checkoutLogoSuperior?: string;
  checkoutLogoInferior?: string;
  checkoutCorPrimaria?: string;
  checkoutCorSecundaria?: string;
  checkoutCronometro?: boolean;
  checkoutTempoMinutos?: number;
  checkoutMensagemUrgencia?: string;
  checkoutProvaSocial?: boolean;
  checkoutIntervaloPop?: number;
  checkoutProvaSocialGenero?: string;
  checkoutAceitaPix?: boolean;
  checkoutAceitaCartao?: boolean;
  checkoutAceitaBoleto?: boolean;
  checkoutMetodoPreferencial?: string;
  checkoutCpfObrigatorio?: boolean;
  checkoutTelObrigatorio?: boolean;
  checkoutPedirEndereco?: boolean;
  produto: {
    id: string;
    nome: string;
    descricao: string;
    imagem: string;
  };
}

export default function CheckoutPlanoPage({ params }: { params: Promise<{ linkUnico: string }> }) {
  const router = useRouter();
  const [linkUnico, setLinkUnico] = useState('');
  const [plano, setPlano] = useState<PlanoOferta | null>(null);
  const [loading, setLoading] = useState(true);
  const [etapa, setEtapa] = useState(1);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [buscandoCep, setBuscandoCep] = useState(false);

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
    metodoPagamento: 'PIX'
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
      const res = await fetch(`/api/planos/link/${linkUnico}`);
      if (!res.ok) throw new Error('Plano não encontrado');
      
      const data = await res.json();
      console.log('📦 Plano carregado:', data.plano);
      
      setPlano(data.plano);
      
      if (data.plano.checkoutCronometro && data.plano.checkoutTempoMinutos) {
        setTempoRestante(data.plano.checkoutTempoMinutos * 60);
      }
      
      if (data.plano.checkoutMetodoPreferencial) {
        setFormData(prev => ({
          ...prev,
          metodoPagamento: data.plano.checkoutMetodoPreferencial
        }));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar plano:', error);
      alert('Plano não encontrado');
      router.push('/');
    }
  };
  useEffect(() => {
    if (!plano?.checkoutCronometro || tempoRestante <= 0) return;

    const interval = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [plano, tempoRestante]);

  useEffect(() => {
    if (!plano?.checkoutProvaSocial || !plano.checkoutIntervaloPop) return;

    const nomesMasculinos = ['João', 'Pedro', 'Carlos', 'Rafael', 'Lucas', 'Felipe', 'Bruno', 'Marcelo'];
    const nomesFemininos = ['Maria', 'Ana', 'Julia', 'Beatriz', 'Camila', 'Larissa', 'Fernanda', 'Paula'];
    const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba', 'Porto Alegre'];

    const mostrarPopup = () => {
      let nome = '';
      
      if (plano.checkoutProvaSocialGenero === 'HOMENS') {
        nome = nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)];
      } else if (plano.checkoutProvaSocialGenero === 'MULHERES') {
        nome = nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];
      } else {
        const todosNomes = [...nomesMasculinos, ...nomesFemininos];
        nome = todosNomes[Math.floor(Math.random() * todosNomes.length)];
      }

      const cidade = cidades[Math.floor(Math.random() * cidades.length)];
      const minutosAtras = Math.floor(Math.random() * 30) + 1;

      const popup = document.createElement('div');
      popup.className = 'fixed bottom-4 left-4 bg-white rounded-lg shadow-xl p-4 max-w-xs z-50 animate-slide-in';
      popup.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="flex-shrink: 0;">
            <div style="width: 40px; height: 40px; background-color: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: #059669; font-size: 20px;">✓</span>
            </div>
          </div>
          <div style="flex: 1;">
            <p style="font-weight: 600; color: #111827; margin: 0;">${nome} de ${cidade}</p>
            <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">Acabou de comprar</p>
            <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0 0;">há ${minutosAtras} minutos</p>
          </div>
        </div>
      `;

      document.body.appendChild(popup);

      setTimeout(() => {
        popup.style.animation = 'slide-out 0.3s ease-out';
        setTimeout(() => popup.remove(), 300);
      }, 5000);
    };

    const interval = setInterval(mostrarPopup, plano.checkoutIntervaloPop * 1000);
    return () => clearInterval(interval);
  }, [plano]);

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const buscarCEP = async () => {
    const cepLimpo = formData.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

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

    setBuscandoCep(false);
  };

  const finalizarPedido = async () => {
    if (!formData.nome || !formData.email || !formData.telefone) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const res = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planoId: plano?.id,
          ...formData
        })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/pedido/${data.vendaId}`);
      } else {
        alert('Erro ao processar pedido');
      }
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert('Erro ao processar pedido');
    }
  };
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          border: '4px solid #e5e7eb', 
          borderTop: '4px solid #8b5cf6', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!plano) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#dc2626' }}>Plano não encontrado</p>
      </div>
    );
  }

  const corPrimaria = plano.checkoutCorPrimaria || '#8b5cf6';
  const corSecundaria = plano.checkoutCorSecundaria || '#667eea';

  return (
    <div style={{
      minHeight: '100vh',
      padding: '32px 16px',
      background: `linear-gradient(135deg, ${corSecundaria} 0%, ${corPrimaria} 100%)`
    }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        {plano.checkoutBanner && (
          <div style={{ marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <img 
              src={plano.checkoutBanner} 
              alt="Banner" 
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        )}

        {plano.checkoutLogoSuperior && (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img 
              src={plano.checkoutLogoSuperior} 
              alt="Logo" 
              style={{ height: '64px', margin: '0 auto' }}
            />
          </div>
        )}

        {plano.checkoutCronometro && tempoRestante > 0 && (
          <div style={{
            backgroundColor: '#dc2626',
            color: 'white',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              {plano.checkoutMensagemUrgencia || '⏰ Oferta expira em:'}
            </p>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{formatarTempo(tempoRestante)}</p>
          </div>
        )}

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{plano.nome}</h1>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>{plano.descricao}</p>
          <p style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: corPrimaria,
            marginBottom: '24px'
          }}>
            R$ {plano.preco.toFixed(2)}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: etapa >= 1 ? '#8b5cf6' : '#d1d5db',
                color: 'white'
              }}>1</div>
              <div style={{
                width: '64px',
                height: '4px',
                backgroundColor: etapa >= 2 ? '#8b5cf6' : '#d1d5db'
              }}></div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: etapa >= 2 ? '#8b5cf6' : '#d1d5db',
                color: 'white'
              }}>2</div>
              <div style={{
                width: '64px',
                height: '4px',
                backgroundColor: etapa >= 3 ? '#8b5cf6' : '#d1d5db'
              }}></div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: etapa >= 3 ? '#8b5cf6' : '#d1d5db',
                color: 'white'
              }}>3</div>
            </div>
          </div>
          {etapa === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="Nome Completo *"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <input
                type="tel"
                placeholder="Telefone *"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              {plano.checkoutCpfObrigatorio && (
                <input
                  type="text"
                  placeholder="CPF *"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              )}
              <button
                onClick={() => setEtapa(plano.checkoutPedirEndereco ? 2 : 3)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: corPrimaria,
                  color: 'white',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Continuar
              </button>
            </div>
          )}

          {etapa === 2 && plano.checkoutPedirEndereco && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="CEP *"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <button
                  onClick={buscarCEP}
                  disabled={buscandoCep}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {buscandoCep ? '...' : 'Buscar'}
                </button>
              </div>
              <input
                type="text"
                placeholder="Rua *"
                value={formData.rua}
                onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="Número *"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Complemento"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <input
                type="text"
                placeholder="Bairro *"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="Cidade *"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Estado *"
                  maxLength={2}
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  onClick={() => setEtapa(1)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Voltar
                </button>
                <button
                  onClick={() => setEtapa(3)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: corPrimaria,
                    color: 'white',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}
          {etapa === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontWeight: '600', marginBottom: '16px' }}>Escolha o método de pagamento:</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                {plano.checkoutAceitaPix && (
                  <button
                    onClick={() => setFormData({ ...formData, metodoPagamento: 'PIX' })}
                    style={{
                      padding: '16px',
                      border: formData.metodoPagamento === 'PIX' ? `2px solid ${corPrimaria}` : '2px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: formData.metodoPagamento === 'PIX' ? '#f3e8ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <p style={{ fontWeight: '600' }}>PIX</p>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Pagamento instantâneo</p>
                  </button>
                )}
                
                {plano.checkoutAceitaCartao && (
                  <button
                    onClick={() => setFormData({ ...formData, metodoPagamento: 'CARTAO' })}
                    style={{
                      padding: '16px',
                      border: formData.metodoPagamento === 'CARTAO' ? `2px solid ${corPrimaria}` : '2px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: formData.metodoPagamento === 'CARTAO' ? '#f3e8ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <p style={{ fontWeight: '600' }}>Cartão</p>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Crédito ou débito</p>
                  </button>
                )}
                
                {plano.checkoutAceitaBoleto && (
                  <button
                    onClick={() => setFormData({ ...formData, metodoPagamento: 'BOLETO' })}
                    style={{
                      padding: '16px',
                      border: formData.metodoPagamento === 'BOLETO' ? `2px solid ${corPrimaria}` : '2px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: formData.metodoPagamento === 'BOLETO' ? '#f3e8ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <p style={{ fontWeight: '600' }}>Boleto</p>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Pague em até 3 dias</p>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button
                  onClick={() => setEtapa(plano.checkoutPedirEndereco ? 2 : 1)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Voltar
                </button>
                <button
                  onClick={finalizarPedido}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: corPrimaria,
                    color: 'white',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  🔒 Finalizar Pedido
                </button>
              </div>
            </div>
          )}
        </div>

        {plano.checkoutLogoInferior && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <img 
              src={plano.checkoutLogoInferior} 
              alt="Logo" 
              style={{ height: '48px', margin: '0 auto', opacity: 0.8 }}
            />
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slide-in {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-100%); opacity: 0; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}