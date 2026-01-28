'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface PlanoOferta {
  id: string;
  nome: string;
  preco: number;
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
  produto: {
    id: string;
    nome: string;
    imagem: string;
  };
}

function CriarPedidoPADForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingPlano, setLoadingPlano] = useState(true);
  const [erro, setErro] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [plano, setPlano] = useState<PlanoOferta | null>(null);
  const [tempoRestante, setTempoRestante] = useState(0);

  const planoId = searchParams.get('planoId');
  const produtoId = searchParams.get('produtoId');
  const valor = searchParams.get('valor');
  const nomePlano = searchParams.get('nome');

  const [formData, setFormData] = useState({
    clienteNome: '',
    clienteCpfCnpj: '',
    clienteTelefone: '',
    clienteEmail: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    quantidade: 1
  });

  useEffect(() => {
    const fetchPlano = async () => {
      if (!planoId) {
        setLoadingPlano(false);
        return;
      }

      try {
        const res = await fetch(`/api/planos/${planoId}`);
        if (res.ok) {
          const data = await res.json();
          console.log('📦 Plano carregado:', data.plano);
          setPlano(data.plano);
          
          if (data.plano.checkoutPadCronometro && data.plano.checkoutPadTempoMinutos) {
            setTempoRestante(data.plano.checkoutPadTempoMinutos * 60);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar plano:', error);
      }
      
      setLoadingPlano(false);
    };

    fetchPlano();
  }, [planoId]);

  useEffect(() => {
    if (!plano?.checkoutCronometro || tempoRestante <= 0) return;

    const interval = setInterval(() => {
      setTempoRestante(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [plano, tempoRestante]);

  useEffect(() => {
    if (!plano?.checkoutProvaSocial || !plano.checkoutPadIntervaloPop) return;

    const nomesMasculinos = ['João', 'Pedro', 'Carlos', 'Rafael', 'Lucas'];
    const nomesFemininos = ['Maria', 'Ana', 'Julia', 'Beatriz', 'Camila'];
    const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'];

    const mostrarPopup = () => {
      let nome = '';
      
      if (plano.checkoutPadProvaSocialGenero === 'HOMENS') {
        nome = nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)];
      } else if (plano.checkoutPadProvaSocialGenero === 'MULHERES') {
        nome = nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];
      } else {
        const todos = [...nomesMasculinos, ...nomesFemininos];
        nome = todos[Math.floor(Math.random() * todos.length)];
      }

      const cidade = cidades[Math.floor(Math.random() * cidades.length)];
      const minutos = Math.floor(Math.random() * 30) + 1;

      const popup = document.createElement('div');
      popup.className = 'fixed bottom-4 left-4 bg-white rounded-lg shadow-xl p-4 max-w-xs z-50';
      popup.style.animation = 'slide-in 0.3s ease-out';
      popup.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="flex-shrink: 0;">
            <div style="width: 40px; height: 40px; background-color: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: #059669; font-size: 20px;">✓</span>
            </div>
          </div>
          <div style="flex: 1;">
            <p style="font-weight: 600; color: #111827; margin: 0;">${nome} de ${cidade}</p>
            <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">Acabou de solicitar</p>
            <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0 0;">há ${minutos} minutos</p>
          </div>
        </div>
      `;

      document.body.appendChild(popup);
      setTimeout(() => {
        popup.style.animation = 'slide-out 0.3s ease-out';
        setTimeout(() => popup.remove(), 300);
      }, 5000);
    };

    const interval = setInterval(mostrarPopup, plano.checkoutPadIntervaloPop * 1000);
    return () => clearInterval(interval);
  }, [plano]);

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const buscarCEP = async () => {
    const cepLimpo = formData.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      alert('CEP deve ter 8 dígitos');
      return;
    }

    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert('CEP não encontrado');
        setBuscandoCep(false);
        return;
      }

      setFormData(prev => ({
        ...prev,
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || ''
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar CEP');
    }
    setBuscandoCep(false);
  };

  const criarPedido = async () => {
    if (!formData.clienteNome || !formData.clienteCpfCnpj || !formData.clienteTelefone) {
      setErro('Preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.cep || !formData.rua || !formData.numero || !formData.bairro || !formData.cidade || !formData.estado) {
      setErro('Preencha todos os campos de endereço');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const response = await fetch('/api/pad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planoId,
          produtoId,
          valor: parseFloat(valor || '0'),
          nome: nomePlano,
          ...formData
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push(`/pad/aguardando/${data.pedido.hash}`);
      } else {
        setErro(data.error || 'Erro ao criar pedido');
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      setErro('Erro ao criar pedido. Tente novamente.');
    }

    setLoading(false);
  };

  const corPrimaria = plano?.checkoutCorPrimaria || '#8b5cf6';
  const corSecundaria = plano?.checkoutCorSecundaria || '#667eea';
  return (
    <div style={{
      minHeight: '100vh',
      padding: '32px 16px',
      background: `linear-gradient(135deg, ${corSecundaria} 0%, ${corPrimaria} 100%)`
    }}>
      <div style={{ maxWidth: '768px', margin: '0 auto' }}>
        {plano?.checkoutPadBanner && (
          <div style={{ marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <img src={plano.checkoutPadBanner} alt="Banner" style={{ width: '100%' }} />
          </div>
        )}

        {plano?.checkoutPadLogoSuperior && (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img src={plano.checkoutPadLogoSuperior} alt="Logo" style={{ height: '64px', margin: '0 auto' }} />
          </div>
        )}

        {plano?.checkoutCronometro && tempoRestante > 0 && (
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
              {plano.checkoutPadMensagemUrgencia || '⏰ Oferta expira em:'}
            </p>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{formatarTempo(tempoRestante)}</p>
          </div>
        )}

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '24px'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>📦 Criar Pedido PAD</h1>
          
          <div style={{
            backgroundColor: '#f3e8ff',
            border: '1px solid #d8b4fe',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{ color: '#6b21a8', fontWeight: '600' }}>{nomePlano}</p>
            <p style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: corPrimaria,
              marginTop: '8px'
            }}>
              R$ {parseFloat(valor || '0').toFixed(2)}
            </p>
          </div>

          {erro && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <p style={{ color: '#dc2626', fontSize: '14px' }}>{erro}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="text"
              placeholder="Nome Completo *"
              value={formData.clienteNome}
              onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />

            <input
              type="text"
              placeholder="CPF *"
              value={formData.clienteCpfCnpj}
              onChange={(e) => setFormData({ ...formData, clienteCpfCnpj: e.target.value })}
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
              value={formData.clienteTelefone}
              onChange={(e) => setFormData({ ...formData, clienteTelefone: e.target.value })}
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
              placeholder="Email (opcional)"
              value={formData.clienteEmail}
              onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '8px' }}>
              <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>📍 Endereço de Entrega</h3>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
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
                    cursor: 'pointer',
                    fontWeight: '500'
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
                  fontSize: '16px',
                  marginBottom: '16px'
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
                  fontSize: '16px',
                  marginBottom: '16px'
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
            </div>

            <input
              type="number"
              min="1"
              placeholder="Quantidade"
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />

            <button
              onClick={criarPedido}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: loading ? '#d1d5db' : corPrimaria,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Criando pedido...' : '✅ CONFIRMAR PEDIDO'}
            </button>
          </div>
        </div>

        {plano?.checkoutPadLogoInferior && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <img src={plano.checkoutPadLogoInferior} alt="Logo" style={{ height: '48px', margin: '0 auto', opacity: 0.8 }} />
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function CriarPedidoPADPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Carregando...</p>
    </div>}>
      <CriarPedidoPADForm />
    </Suspense>
  );
}