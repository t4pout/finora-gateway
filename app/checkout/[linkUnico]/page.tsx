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
  const [processando, setProcessando] = useState(false);

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

  // Busca automática de CEP
  useEffect(() => {
    const cepLimpo = formData.cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      buscarCEP(cepLimpo);
    }
  }, [formData.cep]);

  useEffect(() => {
    if (!plano?.checkoutCronometro || tempoRestante <= 0) return;
    const interval = setInterval(() => {
      setTempoRestante(prev => prev <= 1 ? 0 : prev - 1);
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
      popup.className = 'popup-prova-social';
      popup.innerHTML = `
        <div class="popup-conteudo">
          <div class="popup-icone">✓</div>
          <div class="popup-texto">
            <p class="popup-nome">${nome} de ${cidade}</p>
            <p class="popup-acao">Acabou de comprar</p>
            <p class="popup-tempo">há ${minutosAtras} minutos</p>
          </div>
        </div>
      `;

      document.body.appendChild(popup);
      setTimeout(() => {
        popup.classList.add('popup-saindo');
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

  const buscarCEP = async (cep: string) => {
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
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

    setProcessando(true);

    try {
      const res = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planoId: plano?.id,
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
        router.push(`/pedido/${data.vendaId}`);
      } else {
        const errorData = await res.json();
        alert('Erro ao processar pedido: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert('Erro ao processar pedido');
    } finally {
      setProcessando(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!plano) {
    return (
      <div className="loading-container">
        <p className="error-text">Plano não encontrado</p>
      </div>
    );
  }

  const corPrimaria = plano.checkoutCorPrimaria || '#8b5cf6';
  const corSecundaria = plano.checkoutCorSecundaria || '#667eea';

  return (
    <>
      <div className="checkout-container" style={{
        background: `linear-gradient(135deg, ${corSecundaria} 0%, ${corPrimaria} 100%)`
      }}>
        <div className="checkout-wrapper">
          {plano.checkoutBanner && (
            <div className="banner-container">
              <img src={plano.checkoutBanner} alt="Banner" className="banner-image" />
            </div>
          )}

          {plano.checkoutLogoSuperior && (
            <div className="logo-superior">
              <img src={plano.checkoutLogoSuperior} alt="Logo" />
            </div>
          )}

          {plano.checkoutCronometro && tempoRestante > 0 && (
            <div className="cronometro-urgencia">
              <p className="cronometro-mensagem">
                {plano.checkoutMensagemUrgencia || '⏰ Oferta expira em:'}
              </p>
              <p className="cronometro-tempo">{formatarTempo(tempoRestante)}</p>
            </div>
          )}

          <div className="card-principal">
            <div className="card-header">
              <h1 className="plano-nome">{plano.nome}</h1>
              <p className="plano-descricao">{plano.descricao}</p>
              <div className="plano-preco" style={{ color: corPrimaria }}>
                R$ {plano.preco.toFixed(2)}
              </div>
            </div>

            <div className="progress-bar">
              <div className={`progress-step ${etapa >= 1 ? 'active' : ''}`}>
                <div className="step-circle">1</div>
                <span className="step-label">Dados</span>
              </div>
              <div className={`progress-line ${etapa >= 2 ? 'active' : ''}`}></div>
              <div className={`progress-step ${etapa >= 2 ? 'active' : ''}`}>
                <div className="step-circle">2</div>
                <span className="step-label">Endereço</span>
              </div>
              <div className={`progress-line ${etapa >= 3 ? 'active' : ''}`}></div>
              <div className={`progress-step ${etapa >= 3 ? 'active' : ''}`}>
                <div className="step-circle">3</div>
                <span className="step-label">Pagamento</span>
              </div>
            </div>

            <div className="form-container">
              {etapa === 1 && (
                <div className="form-step fade-in">
                  <div className="form-group">
                    <label>Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Digite seu nome completo"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>E-mail *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Telefone *</label>
                      <input
                        type="tel"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="form-input"
                      />
                    </div>

                    {plano.checkoutCpfObrigatorio && (
                      <div className="form-group">
                        <label>CPF *</label>
                        <input
                          type="text"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                          className="form-input"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setEtapa(plano.checkoutPedirEndereco ? 2 : 3)}
                    className="btn-primary"
                    style={{ backgroundColor: corPrimaria }}
                  >
                    Continuar →
                  </button>
                </div>
              )}

              {etapa === 2 && plano.checkoutPedirEndereco && (
                <div className="form-step fade-in">
                  <div className="form-group">
                    <label>CEP * {buscandoCep && <span className="loading-cep">Buscando...</span>}</label>
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      placeholder="00000-000"
                      className="form-input"
                      maxLength={9}
                    />
                  </div>

                  <div className="form-group">
                    <label>Rua *</label>
                    <input
                      type="text"
                      value={formData.rua}
                      onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                      placeholder="Nome da rua"
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Número *</label>
                      <input
                        type="text"
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        placeholder="123"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Complemento</label>
                      <input
                        type="text"
                        value={formData.complemento}
                        onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                        placeholder="Apto, casa..."
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Bairro *</label>
                    <input
                      type="text"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      placeholder="Nome do bairro"
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Cidade *</label>
                      <input
                        type="text"
                        value={formData.cidade}
                        onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                        placeholder="Cidade"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group" style={{ maxWidth: '100px' }}>
                      <label>UF *</label>
                      <input
                        type="text"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                        placeholder="SP"
                        className="form-input"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="btn-row">
                    <button onClick={() => setEtapa(1)} className="btn-secondary">
                      ← Voltar
                    </button>
                    <button
                      onClick={() => setEtapa(3)}
                      className="btn-primary"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              )}

              {etapa === 3 && (
                <div className="form-step fade-in">
                  <p className="section-title">Escolha o método de pagamento:</p>

                  <div className="payment-methods">
                    {plano.checkoutAceitaPix && (
                      <button
                        onClick={() => setFormData({ ...formData, metodoPagamento: 'PIX' })}
                        className={`payment-card ${formData.metodoPagamento === 'PIX' ? 'active' : ''}`}
                        style={formData.metodoPagamento === 'PIX' ? { borderColor: corPrimaria, backgroundColor: `${corPrimaria}15` } : {}}
                      >
                        <div className="payment-icon">💳</div>
                        <div className="payment-name">PIX</div>
                        <div className="payment-desc">Aprovação instantânea</div>
                      </button>
                    )}

                    {plano.checkoutAceitaCartao && (
                      <button
                        onClick={() => setFormData({ ...formData, metodoPagamento: 'CARTAO' })}
                        className={`payment-card ${formData.metodoPagamento === 'CARTAO' ? 'active' : ''}`}
                        style={formData.metodoPagamento === 'CARTAO' ? { borderColor: corPrimaria, backgroundColor: `${corPrimaria}15` } : {}}
                      >
                        <div className="payment-icon">💳</div>
                        <div className="payment-name">Cartão</div>
                        <div className="payment-desc">Crédito ou débito</div>
                      </button>
                    )}

                    {plano.checkoutAceitaBoleto && (
                      <button
                        onClick={() => setFormData({ ...formData, metodoPagamento: 'BOLETO' })}
                        className={`payment-card ${formData.metodoPagamento === 'BOLETO' ? 'active' : ''}`}
                        style={formData.metodoPagamento === 'BOLETO' ? { borderColor: corPrimaria, backgroundColor: `${corPrimaria}15` } : {}}
                      >
                        <div className="payment-icon">📄</div>
                        <div className="payment-name">Boleto</div>
                        <div className="payment-desc">Pague em até 3 dias</div>
                      </button>
                    )}
                  </div>

                  <div className="btn-row">
                    <button onClick={() => setEtapa(plano.checkoutPedirEndereco ? 2 : 1)} className="btn-secondary">
                      ← Voltar
                    </button>
                    <button
                      onClick={finalizarPedido}
                      disabled={processando}
                      className="btn-primary btn-finalizar"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      {processando ? (
                        <>
                          <span className="spinner-small"></span> Processando...
                        </>
                      ) : (
                        <>🔒 Finalizar Pedido</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {plano.checkoutLogoInferior && (
            <div className="logo-inferior">
              <img src={plano.checkoutLogoInferior} alt="Logo" />
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .checkout-container {
          min-height: 100vh;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .checkout-wrapper {
          max-width: 600px;
          margin: 0 auto;
        }

        .banner-container {
          margin-bottom: 24px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        }

        .banner-image {
          width: 100%;
          height: auto;
          display: block;
        }

        .logo-superior {
          text-align: center;
          margin-bottom: 24px;
        }

        .logo-superior img {
          height: 60px;
        }

        .cronometro-urgencia {
          background: linear-gradient(135deg, #dc2626, #991b1b);
          color: white;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(220, 38, 38, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        .cronometro-mensagem {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          opacity: 0.95;
        }

        .cronometro-tempo {
          font-size: 42px;
          font-weight: bold;
          letter-spacing: 2px;
        }

        .card-principal {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }

        .card-header {
          padding: 32px;
          text-align: center;
          border-bottom: 1px solid #f3f4f6;
        }

        .plano-nome {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #111827;
        }

        .plano-descricao {
          color: #6b7280;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .plano-preco {
          font-size: 48px;
          font-weight: 800;
          margin-top: 16px;
        }

        .progress-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          gap: 0;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e5e7eb;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          transition: all 0.3s;
        }

        .progress-step.active .step-circle {
          background: #8b5cf6;
          color: white;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .step-label {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .progress-step.active .step-label {
          color: #8b5cf6;
          font-weight: 600;
        }

        .progress-line {
          width: 60px;
          height: 3px;
          background: #e5e7eb;
          transition: all 0.3s;
        }

        .progress-line.active {
          background: #8b5cf6;
        }

        .form-container {
          padding: 32px;
        }

        .form-step {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .fade-in {
          animation: fadeIn 0.4s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .loading-cep {
          font-size: 12px;
          color: #8b5cf6;
          font-weight: 400;
          margin-left: 8px;
        }

        .form-input {
          padding: 14px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.2s;
          outline: none;
        }

        .form-input:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 16px;
        }

        .payment-methods {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
        }

        .payment-card {
          padding: 24px;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          background: white;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
        }

        .payment-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .payment-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .payment-name {
          font-weight: 600;
          font-size: 16px;
          color: #111827;
          margin-bottom: 4px;
        }

        .payment-desc {
          font-size: 13px;
          color: #6b7280;
        }

        .btn-row {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .btn-primary {
          flex: 1;
          padding: 16px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          color: #6b7280;
          background: white;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-secondary:hover {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .btn-finalizar {
          font-size: 18px;
          padding: 18px;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .logo-inferior {
          text-align: center;
          margin-top: 32px;
          opacity: 0.7;
        }

        .logo-inferior img {
          height: 48px;
        }

        .loading-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-text {
          color: #dc2626;
          font-size: 18px;
          font-weight: 600;
        }

        .popup-prova-social {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          padding: 16px;
          max-width: 300px;
          z-index: 1000;
          animation: slideIn 0.4s ease-out;
        }

        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .popup-saindo {
          animation: slideOut 0.3s ease-out forwards !important;
        }

        @keyframes slideOut {
          to { transform: translateX(-100%); opacity: 0; }
        }

        .popup-conteudo {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .popup-icone {
          width: 40px;
          height: 40px;
          background: #d1fae5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #059669;
          font-size: 20px;
          flex-shrink: 0;
        }

        .popup-texto {
          flex: 1;
        }

        .popup-nome {
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .popup-acao {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .popup-tempo {
          font-size: 12px;
          color: #9ca3af;
        }

        @media (max-width: 640px) {
          .checkout-container {
            padding: 12px;
          }

          .card-header {
            padding: 24px 20px;
          }

          .plano-nome {
            font-size: 24px;
          }

          .plano-preco {
            font-size: 36px;
          }

          .form-container {
            padding: 24px 20px;
          }

          .progress-bar {
            padding: 24px 12px;
          }

          .step-label {
            display: none;
          }

          .progress-line {
            width: 40px;
          }

          .form-row {
            flex-direction: column;
          }

          .payment-methods {
            grid-template-columns: 1fr;
          }

          .btn-row {
            flex-direction: column;
          }

          .popup-prova-social {
            left: 12px;
            right: 12px;
            max-width: none;
          }
        }
      `}</style>
    </>
  );
}