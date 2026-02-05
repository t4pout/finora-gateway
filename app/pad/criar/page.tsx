'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CriarPedidoPADForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);

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
    cep: ''
  });
  const [plano, setPlano] = useState<any>(null);
  const [loadingPlano, setLoadingPlano] = useState(true);

  // Carregar dados do plano
  useEffect(() => {
    const carregarPlano = async () => {
      if (!planoId) return;
      
      try {
        const response = await fetch(`/api/planos/${planoId}`);
        const data = await response.json();
        
        if (response.ok && data.plano) {
          setPlano(data.plano);
          console.log('📦 Plano carregado:', data.plano);
        }
      } catch (error) {
        console.error('Erro ao carregar plano:', error);
      } finally {
        setLoadingPlano(false);
      }
    };
    
    carregarPlano();
  }, [planoId]);

  // Disparar InitiateCheckout quando plano carregar
  useEffect(() => {
    if (plano && produtoId && valor) {
      if (typeof window !== 'undefined' && (window as any).fbq) {
        try {
          (window as any).fbq('track', 'InitiateCheckout', {
            content_name: plano.nome || nomePlano,
            content_ids: [produtoId],
            content_type: 'product',
            value: parseFloat(valor || '0'),
            currency: 'BRL'
          });
          console.log('📊 Pixel: InitiateCheckout disparado');
        } catch (e) {
          console.error('Erro pixel:', e);
        }
      }
    }
  }, [plano]);
  // Pop-up de Prova Social
  useEffect(() => {
    if (!plano?.checkoutPadProvaSocial || !plano.checkoutPadIntervaloPop) return;

    const nomesMasculinos = ['João', 'Pedro', 'Carlos', 'Rafael', 'Lucas', 'Felipe', 'Bruno', 'Marcelo'];
    const nomesFemininos = ['Maria', 'Ana', 'Julia', 'Beatriz', 'Camila', 'Larissa', 'Fernanda', 'Paula'];
    const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba', 'Porto Alegre'];

    const mostrarPopup = () => {
      let nome = '';
      
      if (plano.checkoutPadProvaSocialGenero === 'HOMENS') {
        nome = nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)];
      } else if (plano.checkoutPadProvaSocialGenero === 'MULHERES') {
        nome = nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];
      } else {
        const todosNomes = [...nomesMasculinos, ...nomesFemininos];
        nome = todosNomes[Math.floor(Math.random() * todosNomes.length)];
      }

      const cidade = cidades[Math.floor(Math.random() * cidades.length)];
      const minutosAtras = Math.floor(Math.random() * 30) + 1;

      const popup = document.createElement('div');
      popup.style.cssText = 'position: fixed; bottom: 16px; left: 16px; background: white; border-radius: 8px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); padding: 16px; max-width: 320px; z-index: 9999; animation: slideIn 0.3s ease-out;';
      popup.innerHTML = `
        <style>
          @keyframes slideIn {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(-100%); opacity: 0; }
          }
        </style>
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
        popup.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => popup.remove(), 300);
      }, 5000);
    };

    const interval = setInterval(mostrarPopup, plano.checkoutPadIntervaloPop * 1000);
    return () => clearInterval(interval);
  }, [plano]);


  const buscarCEP = async (cep: string) => {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Verifica se tem 8 dígitos
    if (cepLimpo.length !== 8) return;
    
    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData({
          ...formData,
          cep: cepLimpo,
          rua: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        });
      } else {
        alert('CEP não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const response = await fetch('/api/pad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          produtoId,
          produtoNome: nomePlano,
          valor: parseFloat(valor || '0'),
          quantidade: 1
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Disparar Purchase
        if (typeof window !== 'undefined' && (window as any).fbq) {
          try {
            (window as any).fbq('track', 'Purchase', {
              content_name: nomePlano,
              content_ids: [produtoId],
              content_type: 'product',
              value: parseFloat(valor || '0'),
              currency: 'BRL',
              order_id: data.pedido?.hash
            });
            console.log('📊 Pixel: Purchase disparado');
          } catch (e) {
            console.error('Erro pixel:', e);
          }
        }
        
        // Redirecionar para a página de aguardando aprovação
        router.push(`/pad/aguardando/${data.pedido.hash}`);
      } else {
        setErro(data.error || 'Erro ao criar pedido');
      }
    } catch (error) {
      console.error('Erro:', error);
      setErro('Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  const corPrimaria = plano?.checkoutPadCorPrimaria || '#9333ea';
  const corSecundaria = plano?.checkoutPadCorSecundaria || '#a855f7';

  return (
    <div style={{
      minHeight: '100vh',
      padding: '32px 16px',
      background: `linear-gradient(135deg, ${corSecundaria} 0%, ${corPrimaria} 100%)`
    }}>
      {/* Banner */}
      {plano?.checkoutPadBanner && (
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto 24px', 
          borderRadius: '8px', 
          overflow: 'hidden', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
        }}>
          <img 
            src={plano.checkoutPadBanner} 
            alt="Banner" 
            style={{ 
              width: '100%', 
              height: 'auto',
              display: 'block'
            }} 
          />
        </div>
      )}
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finalizar Pedido</h1>
          <p className="text-gray-600 mb-6">Preencha seus dados para continuar</p>

          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-purple-700">Plano selecionado</div>
                <div className="font-bold text-gray-900">{nomePlano}</div>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                R$ {parseFloat(valor || '0').toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>

          {erro && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-4">📋 Dados Pessoais</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome Completo *"
                  value={formData.clienteNome}
                  onChange={(e) => setFormData({...formData, clienteNome: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="CPF/CNPJ *"
                    value={formData.clienteCpfCnpj}
                    onChange={(e) => setFormData({...formData, clienteCpfCnpj: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Telefone *"
                    value={formData.clienteTelefone}
                    onChange={(e) => setFormData({...formData, clienteTelefone: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.clienteEmail}
                  onChange={(e) => setFormData({...formData, clienteEmail: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4">📍 Endereço de Entrega</h3>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="CEP * (digite 8 números)"
                    value={formData.cep}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, cep: valor});
                      if (valor.length === 8) {
                        buscarCEP(valor);
                      }
                    }}
                    maxLength={8}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                  {buscandoCep && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    </div>
                  )}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Rua *"
                    value={formData.rua}
                    onChange={(e) => setFormData({...formData, rua: e.target.value})}
                    required
                    className="md:col-span-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Número *"
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Complemento"
                  value={formData.complemento}
                  onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <input
                  type="text"
                  placeholder="Bairro *"
                  value={formData.bairro}
                  onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Cidade *"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    required
                    className="md:col-span-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="UF *"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    required
                    maxLength={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'PROCESSANDO...' : 'CONFIRMAR PEDIDO'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CriarPedidoPADPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-purple-600 text-xl">Carregando...</div>
      </div>
    }>
      <CriarPedidoPADForm />
    </Suspense>
  );
}