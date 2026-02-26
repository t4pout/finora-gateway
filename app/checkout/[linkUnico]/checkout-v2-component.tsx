'use client';

interface PlanoOferta {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  checkoutBanner?: string;
  checkoutLogoSuperior?: string;
  checkoutLogoInferior?: string;
  checkoutCorPrimaria?: string;
  checkoutCronometro?: boolean;
  checkoutMensagemUrgencia?: string;
  checkoutProvaSocial?: boolean;
  checkoutAceitaPix?: boolean;
  checkoutAceitaCartao?: boolean;
  checkoutAceitaBoleto?: boolean;
  checkoutPedirEndereco?: boolean;
  produto: { id: string; nome: string; descricao: string; imagem: string; };
  orderBumps?: { orderBump: { id: string; titulo: string; descricao: string | null; preco: number; imagem: string | null } }[];
}

interface Props {
  plano: PlanoOferta;
  formData: any;
  setFormData: (d: any) => void;
  etapa: number;
  setEtapa: (e: number) => void;
  processando: boolean;
  buscandoCep: boolean;
  tempoRestante: number;
  finalizarPedido: () => void;
  validarCPF: (cpf: string) => boolean;
  formatarTempo: (s: number) => string;
  orderBumpsSelecionados: string[];
  setOrderBumpsSelecionados: (ids: string[]) => void;
}

export default function CheckoutV2({ plano, formData, setFormData, etapa, setEtapa, processando, buscandoCep, tempoRestante, finalizarPedido, validarCPF, formatarTempo, orderBumpsSelecionados, setOrderBumpsSelecionados }: Props) {
  const cor = plano.checkoutCorPrimaria || '#16a34a';

  const totalComBumps = plano.preco + (plano.orderBumps
    ? plano.orderBumps.filter(ob => orderBumpsSelecionados.includes(ob.orderBump.id)).reduce((acc, ob) => acc + ob.orderBump.preco, 0)
    : 0);

  const avancarEtapa1 = () => {
    if (!formData.nome || !formData.email || !formData.telefone) { alert('Preencha todos os campos obrigatórios'); return; }
    if (!formData.cpf || !validarCPF(formData.cpf)) { alert('CPF inválido!'); return; }
    setEtapa(plano?.checkoutPedirEndereco ? 2 : 3);
  };

  return (
    <>
      <div className="v2-page">
        <div className="v2-wrapper">

          {plano.checkoutLogoSuperior && (
            <div className="v2-logo-top"><img src={plano.checkoutLogoSuperior} alt="Logo" /></div>
          )}

          {plano.checkoutBanner && (
            <div className="v2-banner"><img src={plano.checkoutBanner} alt="Banner" /></div>
          )}

          {plano.checkoutCronometro && tempoRestante > 0 && (
            <div className="v2-timer">
              <span>{plano.checkoutMensagemUrgencia || '⏰ Oferta expira em:'}</span>
              <strong>{formatarTempo(tempoRestante)}</strong>
            </div>
          )}

          <div className="v2-header" style={{ borderTop: `4px solid ${cor}` }}>
            <h1 className="v2-produto-nome">{plano.nome}</h1>
            <p className="v2-produto-desc">{plano.descricao}</p>
            <div className="v2-preco" style={{ color: cor }}>R$ {plano.preco.toFixed(2).replace('.', ',')}</div>
          </div>

          {etapa === 1 && (
            <div className="v2-card">
              <div className="v2-step-title" style={{ background: cor }}>
                <span className="v2-step-num">1</span> Seus Dados
              </div>
              <div className="v2-form">
                <div className="v2-field">
                  <label>👤 Nome Completo *</label>
                  <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Digite seu nome completo" className="v2-input" />
                </div>
                <div className="v2-field">
                  <label>✉️ E-mail *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="seu@email.com" className="v2-input" />
                </div>
                <div className="v2-row">
                  <div className="v2-field">
                    <label>📱 Telefone *</label>
                    <input type="tel" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} placeholder="(00) 00000-0000" className="v2-input" />
                  </div>
                  <div className="v2-field">
                    <label>🪪 CPF *</label>
                    <input
                      type="text" value={formData.cpf}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
                        else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
                        setFormData({...formData, cpf: v});
                      }}
                      placeholder="000.000.000-00" className="v2-input" maxLength={14}
                    />
                  </div>
                </div>
                <button onClick={avancarEtapa1} className="v2-btn" style={{ background: cor }}>Continuar →</button>
              </div>
            </div>
          )}

          {etapa === 2 && plano.checkoutPedirEndereco && (
            <div className="v2-card">
              <div className="v2-step-title" style={{ background: cor }}>
                <span className="v2-step-num">2</span> Endereço de Entrega
              </div>
              <div className="v2-form">
                <div className="v2-field">
                  <label>📍 CEP * {buscandoCep && <span className="v2-loading">Buscando...</span>}</label>
                  <input type="text" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} placeholder="00000-000" className="v2-input" maxLength={9} />
                </div>
                <div className="v2-field">
                  <label>Rua *</label>
                  <input type="text" value={formData.rua} onChange={e => setFormData({...formData, rua: e.target.value})} placeholder="Nome da rua" className="v2-input" />
                </div>
                <div className="v2-row">
                  <div className="v2-field">
                    <label>Número *</label>
                    <input type="text" value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} placeholder="123" className="v2-input" />
                  </div>
                  <div className="v2-field">
                    <label>Complemento</label>
                    <input type="text" value={formData.complemento} onChange={e => setFormData({...formData, complemento: e.target.value})} placeholder="Apto..." className="v2-input" />
                  </div>
                </div>
                <div className="v2-field">
                  <label>Bairro *</label>
                  <input type="text" value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} placeholder="Nome do bairro" className="v2-input" />
                </div>
                <div className="v2-row">
                  <div className="v2-field">
                    <label>Cidade *</label>
                    <input type="text" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} placeholder="Cidade" className="v2-input" />
                  </div>
                  <div className="v2-field" style={{maxWidth:'80px'}}>
                    <label>UF *</label>
                    <input type="text" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value.toUpperCase()})} placeholder="SP" className="v2-input" maxLength={2} />
                  </div>
                </div>
                <div className="v2-btn-row">
                  <button onClick={() => setEtapa(1)} className="v2-btn-back">← Voltar</button>
                  <button onClick={() => setEtapa(3)} className="v2-btn" style={{ background: cor }}>Continuar →</button>
                </div>
              </div>
            </div>
          )}

          {etapa === 3 && (
            <div className="v2-card">
              <div className="v2-step-title" style={{ background: cor }}>
                <span className="v2-step-num">{plano.checkoutPedirEndereco ? '3' : '2'}</span> Pagamento
              </div>
              <div className="v2-form">
                {plano.produto && (
                  <div className="v2-produto">
                    {plano.produto.imagem && <img src={plano.produto.imagem} alt={plano.produto.nome} className="v2-produto-img" />}
                    <div>
                      <div className="v2-produto-titulo">{plano.produto.nome}</div>
                      <div className="v2-produto-descricao">{plano.produto.descricao}</div>
                    </div>
                  </div>
                )}

                {plano.orderBumps && plano.orderBumps.length > 0 && (
                  <div className="v2-ob-container">
                    <p className="v2-ob-titulo">Adicione ao seu pedido:</p>
                    {plano.orderBumps.map((ob) => (
                      <label key={ob.orderBump.id} className={orderBumpsSelecionados.includes(ob.orderBump.id) ? 'v2-ob-card v2-ob-ativo' : 'v2-ob-card'} style={orderBumpsSelecionados.includes(ob.orderBump.id) ? { borderColor: cor, background: cor + '10' } : {}}>
                        <input
                          type="checkbox"
                          checked={orderBumpsSelecionados.includes(ob.orderBump.id)}
                          onChange={(e) => {
                            if (e.target.checked) setOrderBumpsSelecionados([...orderBumpsSelecionados, ob.orderBump.id]);
                            else setOrderBumpsSelecionados(orderBumpsSelecionados.filter(id => id !== ob.orderBump.id));
                          }}
                          className="v2-ob-checkbox"
                        />
                        {ob.orderBump.imagem && <img src={ob.orderBump.imagem} alt={ob.orderBump.titulo} className="v2-ob-imagem" />}
                        <div className="v2-ob-info">
                          <div className="v2-ob-nome">{ob.orderBump.titulo}</div>
                          {ob.orderBump.descricao && <div className="v2-ob-desc">{ob.orderBump.descricao}</div>}
                        </div>
                        <div className="v2-ob-preco" style={{ color: cor }}>+ R$ {ob.orderBump.preco.toFixed(2).replace('.', ',')}</div>
                      </label>
                    ))}
                    {orderBumpsSelecionados.length > 0 && (
                      <div className="v2-ob-total">Total com adicionais: <strong>R$ {totalComBumps.toFixed(2).replace('.', ',')}</strong></div>
                    )}
                  </div>
                )}

                {plano.checkoutAceitaPix && (
                  <button onClick={() => setFormData({...formData, metodoPagamento: 'PIX'})} className={`v2-metodo ${formData.metodoPagamento === 'PIX' ? 'v2-metodo-ativo' : ''}`} style={formData.metodoPagamento === 'PIX' ? { borderColor: cor, background: `${cor}10` } : {}}>
                    <img src="https://logodownload.org/wp-content/uploads/2020/02/pix-bc-logo-0.png" alt="PIX" style={{width:'40px', height:'40px', objectFit:'contain'}} />
                    <div>
                      <div className="v2-metodo-nome">PIX</div>
                      <div className="v2-metodo-desc">✅ Aprovação instantânea &nbsp;✅ 100% seguro &nbsp;✅ Sem taxas</div>
                    </div>
                    {formData.metodoPagamento === 'PIX' && <span className="v2-check" style={{ color: cor }}>✓</span>}
                  </button>
                )}

                {plano.checkoutAceitaCartao && (
                  <button onClick={() => setFormData({...formData, metodoPagamento: 'CARTAO'})} className={`v2-metodo ${formData.metodoPagamento === 'CARTAO' ? 'v2-metodo-ativo' : ''}`} style={formData.metodoPagamento === 'CARTAO' ? { borderColor: cor, background: `${cor}10` } : {}}>
                    <span style={{fontSize:'32px'}}>💳</span>
                    <div>
                      <div className="v2-metodo-nome">Cartão de Crédito</div>
                      <div className="v2-metodo-desc">✅ Aprovação rápida &nbsp;✅ Parcelamento disponível</div>
                    </div>
                    {formData.metodoPagamento === 'CARTAO' && <span className="v2-check" style={{ color: cor }}>✓</span>}
                  </button>
                )}

                {plano.checkoutAceitaBoleto && (
                  <button onClick={() => setFormData({...formData, metodoPagamento: 'BOLETO'})} className={`v2-metodo ${formData.metodoPagamento === 'BOLETO' ? 'v2-metodo-ativo' : ''}`} style={formData.metodoPagamento === 'BOLETO' ? { borderColor: cor, background: `${cor}10` } : {}}>
                    <span style={{fontSize:'32px'}}>📄</span>
                    <div>
                      <div className="v2-metodo-nome">Boleto Bancário</div>
                      <div className="v2-metodo-desc">✅ Pague em até 3 dias úteis</div>
                    </div>
                    {formData.metodoPagamento === 'BOLETO' && <span className="v2-check" style={{ color: cor }}>✓</span>}
                  </button>
                )}

                <div className="v2-btn-row">
                  <button onClick={() => setEtapa(plano.checkoutPedirEndereco ? 2 : 1)} className="v2-btn-back">← Voltar</button>
                  <button onClick={finalizarPedido} disabled={processando} className="v2-btn v2-btn-finalizar" style={{ background: cor }}>
                    {processando ? 'Processando...' : '🔒 Finalizar Pedido'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {plano.checkoutLogoInferior && (
            <div className="v2-logo-bottom"><img src={plano.checkoutLogoInferior} alt="Logo" /></div>
          )}

        </div>
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .v2-page { min-height: 100vh; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
        .v2-wrapper { max-width: 560px; margin: 0 auto; }
        .v2-logo-top { text-align: center; margin-bottom: 20px; }
        .v2-logo-top img { height: 56px; }
        .v2-banner { margin-bottom: 20px; border-radius: 12px; overflow: hidden; }
        .v2-banner img { width: 100%; display: block; }
        .v2-timer { background: #dc2626; color: white; border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
        .v2-timer strong { font-size: 28px; letter-spacing: 2px; }
        .v2-header { background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; text-align: center; }
        .v2-produto-nome { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px; }
        .v2-produto-desc { color: #6b7280; font-size: 14px; margin-bottom: 12px; }
        .v2-preco { font-size: 40px; font-weight: 800; }
        .v2-card { background: white; border-radius: 12px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .v2-step-title { color: white; padding: 14px 20px; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
        .v2-step-num { width: 28px; height: 28px; background: rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }
        .v2-form { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .v2-field { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .v2-field label { font-size: 13px; font-weight: 600; color: #374151; }
        .v2-loading { font-size: 12px; color: #9ca3af; margin-left: 6px; }
        .v2-input { padding: 12px 14px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 15px; outline: none; transition: border-color 0.2s; }
        .v2-input:focus { border-color: #6b7280; }
        .v2-row { display: flex; gap: 12px; }
        .v2-btn { flex: 1; padding: 14px; border: none; border-radius: 8px; font-size: 16px; font-weight: 700; color: white; cursor: pointer; transition: opacity 0.2s; }
        .v2-btn:hover:not(:disabled) { opacity: 0.9; }
        .v2-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .v2-btn-finalizar { font-size: 17px; padding: 16px; }
        .v2-btn-back { padding: 14px 20px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 15px; font-weight: 600; color: #6b7280; background: white; cursor: pointer; }
        .v2-btn-row { display: flex; gap: 10px; }
        .v2-produto { display: flex; gap: 14px; padding: 14px; background: #f9fafb; border-radius: 8px; align-items: center; }
        .v2-produto-img { width: 72px; height: 72px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .v2-produto-titulo { font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 4px; }
        .v2-produto-descricao { font-size: 13px; color: #6b7280; }
        .v2-metodo { width: 100%; padding: 14px; border: 2px solid #e5e7eb; border-radius: 10px; background: white; cursor: pointer; display: flex; align-items: center; gap: 14px; text-align: left; transition: all 0.2s; }
        .v2-metodo:hover { border-color: #9ca3af; }
        .v2-metodo-ativo { box-shadow: 0 0 0 1px currentColor; }
        .v2-metodo-nome { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 3px; }
        .v2-metodo-desc { font-size: 12px; color: #6b7280; }
        .v2-check { margin-left: auto; font-size: 22px; font-weight: bold; }
        .v2-ob-container { display: flex; flex-direction: column; gap: 10px; }
        .v2-ob-titulo { font-size: 15px; font-weight: 700; color: #111827; }
        .v2-ob-card { display: flex; align-items: center; gap: 12px; padding: 14px; border: 2px solid #e5e7eb; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: white; }
        .v2-ob-card:hover { border-color: #9ca3af; }
        .v2-ob-ativo { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .v2-ob-checkbox { width: 20px; height: 20px; flex-shrink: 0; cursor: pointer; }
        .v2-ob-imagem { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .v2-ob-info { flex: 1; }
        .v2-ob-nome { font-size: 14px; font-weight: 700; color: #111827; }
        .v2-ob-desc { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .v2-ob-preco { font-size: 15px; font-weight: 800; white-space: nowrap; }
        .v2-ob-total { padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534; font-size: 14px; text-align: center; }
        .v2-logo-bottom { text-align: center; margin-top: 20px; opacity: 0.6; }
        .v2-logo-bottom img { height: 40px; }
        @media (max-width: 640px) {
          .v2-page { padding: 12px; }
          .v2-row { flex-direction: column; }
          .v2-btn-row { flex-direction: column; }
        }
      `}</style>
    </>
  );
}