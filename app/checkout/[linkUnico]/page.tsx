'use client';

interface PlanoOferta {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  checkoutVersao?: string;
  checkoutBanner?: string;
  checkoutLogoSuperior?: string;
  checkoutLogoInferior?: string;
  checkoutCorPrimaria?: string;
  checkoutCronometro?: boolean;
  checkoutMensagemUrgencia?: string;
  checkoutProvaSocial?: boolean;
  checkoutIntervaloPop?: number;
  checkoutProvaSocialGenero?: string;
  checkoutAceitaPix?: boolean;
  checkoutAceitaCartao?: boolean;
  checkoutAceitaBoleto?: boolean;
  checkoutPedirEndereco?: boolean;
  produto: { id: string; nome: string; descricao: string; imagem: string; };
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
}

export default function CheckoutV2Component({
  plano, formData, setFormData, etapa, setEtapa,
  processando, buscandoCep, tempoRestante,
  finalizarPedido, validarCPF, formatarTempo
}: Props) {
  const cor = plano.checkoutCorPrimaria || '#16a34a';

  const avancarEtapa1 = () => {
    if (!formData.nome || !formData.email || !formData.telefone) { alert('Preencha todos os campos'); return; }
    if (!formData.cpf || !validarCPF(formData.cpf)) { alert('CPF inválido'); return; }
    setEtapa(plano?.checkoutPedirEndereco ? 2 : 3);
  };

  return (
    <>
      <div className="v2-page">
        <div className="v2-wrap">

          {plano.checkoutLogoSuperior && (
            <div className="v2-logo"><img src={plano.checkoutLogoSuperior} alt="Logo" /></div>
          )}
          {plano.checkoutBanner && (
            <div className="v2-banner"><img src={plano.checkoutBanner} alt="Banner" /></div>
          )}
          {plano.checkoutCronometro && tempoRestante > 0 && (
            <div className="v2-crono" style={{ background: cor }}>
              <span>{plano.checkoutMensagemUrgencia || '⏰ Oferta expira em:'}</span>
              <strong>{formatarTempo(tempoRestante)}</strong>
            </div>
          )}

          {/* Produto */}
          <div className="v2-card">
            {plano.produto?.imagem ? (
              <div className="v2-prod-row">
                <img src={plano.produto.imagem} alt={plano.produto.nome} className="v2-prod-img" />
                <div>
                  <div className="v2-prod-nome">{plano.nome}</div>
                  <div className="v2-prod-preco" style={{ color: cor }}>R$ {plano.preco.toFixed(2)}</div>
                </div>
              </div>
            ) : (
              <div className="v2-prod-solo">
                <div className="v2-prod-nome">{plano.nome}</div>
                <div className="v2-prod-preco" style={{ color: cor }}>R$ {plano.preco.toFixed(2)}</div>
              </div>
            )}
          </div>

          {/* STEP 1 */}
          <div className="v2-step-block">
            <div className="v2-step-head" style={{ background: etapa >= 1 ? cor : '#9ca3af' }}>
              <span className="v2-step-num">1</span>
              <span className="v2-step-label">DADOS PESSOAIS</span>
            </div>
            {etapa === 1 && (
              <div className="v2-step-body">
                <div className="v2-field">
                  <label>NOME COMPLETO</label>
                  <div className="v2-input-wrap">
                    <span className="v2-input-icon">👤</span>
                    <input type="text" placeholder="Nome Completo" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                  </div>
                </div>
                <div className="v2-field">
                  <label>SEU E-MAIL</label>
                  <div className="v2-input-wrap">
                    <span className="v2-input-icon">✉️</span>
                    <input type="email" placeholder="E-mail" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>
                <div className="v2-field">
                  <label>CELULAR COM WHATSAPP</label>
                  <div className="v2-input-wrap">
                    <span className="v2-input-icon">📱</span>
                    <input type="tel" placeholder="Celular com WhatsApp" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
                  </div>
                </div>
                <div className="v2-field">
                  <label>CPF</label>
                  <div className="v2-input-wrap">
                    <span className="v2-input-icon">🪪</span>
                    <input
                      type="text" placeholder="CPF" maxLength={14} value={formData.cpf}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
                        else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
                        setFormData({ ...formData, cpf: v });
                      }}
                    />
                  </div>
                </div>
                <button className="v2-btn-continuar" style={{ background: cor }} onClick={avancarEtapa1}>
                  CONTINUAR →
                </button>
              </div>
            )}
          </div>

          {/* STEP 2 - Endereço */}
          {plano.checkoutPedirEndereco && (
            <div className="v2-step-block">
              <div className="v2-step-head" style={{ background: etapa >= 2 ? cor : '#9ca3af' }}>
                <span className="v2-step-num">2</span>
                <span className="v2-step-label">DADOS PARA ENVIO</span>
              </div>
              {etapa === 2 && (
                <div className="v2-step-body">
                  <div className="v2-field">
                    <label>CEP {buscandoCep && <span className="v2-buscando">Buscando...</span>}</label>
                    <div className="v2-input-wrap">
                      <span className="v2-input-icon">📍</span>
                      <input type="text" placeholder="CEP" maxLength={9} value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} />
                    </div>
                  </div>
                  <div className="v2-field">
                    <label>RUA</label>
                    <div className="v2-input-wrap">
                      <input type="text" placeholder="Rua" value={formData.rua} onChange={e => setFormData({ ...formData, rua: e.target.value })} />
                    </div>
                  </div>
                  <div className="v2-row">
                    <div className="v2-field">
                      <label>NÚMERO</label>
                      <div className="v2-input-wrap"><input type="text" placeholder="Nº" value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} /></div>
                    </div>
                    <div className="v2-field">
                      <label>COMPLEMENTO</label>
                      <div className="v2-input-wrap"><input type="text" placeholder="Apto..." value={formData.complemento} onChange={e => setFormData({ ...formData, complemento: e.target.value })} /></div>
                    </div>
                  </div>
                  <div className="v2-field">
                    <label>BAIRRO</label>
                    <div className="v2-input-wrap"><input type="text" placeholder="Bairro" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} /></div>
                  </div>
                  <div className="v2-row">
                    <div className="v2-field" style={{ flex: 2 }}>
                      <label>CIDADE</label>
                      <div className="v2-input-wrap"><input type="text" placeholder="Cidade" value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} /></div>
                    </div>
                    <div className="v2-field" style={{ flex: 1 }}>
                      <label>UF</label>
                      <div className="v2-input-wrap"><input type="text" placeholder="SP" maxLength={2} value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value.toUpperCase() })} /></div>
                    </div>
                  </div>
                  <div className="v2-btn-row">
                    <button className="v2-btn-voltar" onClick={() => setEtapa(1)}>← Voltar</button>
                    <button className="v2-btn-continuar" style={{ background: cor }} onClick={() => setEtapa(3)}>CONTINUAR →</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 - Pagamento */}
          <div className="v2-step-block">
            <div className="v2-step-head" style={{ background: etapa >= 3 ? cor : '#9ca3af' }}>
              <span className="v2-step-num">{plano.checkoutPedirEndereco ? '3' : '2'}</span>
              <span className="v2-step-label">DADOS DE PAGAMENTO</span>
            </div>
            {etapa === 3 && (
              <div className="v2-step-body">
                <div className="v2-metodos">
                  {plano.checkoutAceitaPix && (
                    <button className={`v2-metodo-tab ${formData.metodoPagamento === 'PIX' ? 'v2-metodo-ativo' : ''}`} style={formData.metodoPagamento === 'PIX' ? { borderColor: cor, color: cor } : {}} onClick={() => setFormData({ ...formData, metodoPagamento: 'PIX' })}>
                      <img src="https://logodownload.org/wp-content/uploads/2020/02/pix-bc-logo-0.png" alt="PIX" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                      PIX
                    </button>
                  )}
                  {plano.checkoutAceitaCartao && (
                    <button className={`v2-metodo-tab ${formData.metodoPagamento === 'CARTAO' ? 'v2-metodo-ativo' : ''}`} style={formData.metodoPagamento === 'CARTAO' ? { borderColor: cor, color: cor } : {}} onClick={() => setFormData({ ...formData, metodoPagamento: 'CARTAO' })}>
                      💳 Cartão de crédito
                    </button>
                  )}
                  {plano.checkoutAceitaBoleto && (
                    <button className={`v2-metodo-tab ${formData.metodoPagamento === 'BOLETO' ? 'v2-metodo-ativo' : ''}`} style={formData.metodoPagamento === 'BOLETO' ? { borderColor: cor, color: cor } : {}} onClick={() => setFormData({ ...formData, metodoPagamento: 'BOLETO' })}>
                      📄 Boleto
                    </button>
                  )}
                </div>

                {formData.metodoPagamento === 'PIX' && (
                  <div className="v2-pix-info">
                    <div className="v2-pix-item" style={{ color: cor }}>
                      <span className="v2-pix-check">✓</span>
                      <div><strong>IMEDIATO</strong><p>Ao selecionar Gerar Pix o código estará disponível.</p></div>
                    </div>
                    <div className="v2-pix-item" style={{ color: cor }}>
                      <span className="v2-pix-check">✓</span>
                      <div><strong>PAGAMENTO SIMPLES</strong><p>Abra o app do banco, procure pelo PIX e escaneie o QRcode.</p></div>
                    </div>
                    <div className="v2-pix-item" style={{ color: cor }}>
                      <span className="v2-pix-check">✓</span>
                      <div><strong>100% SEGURO</strong><p>O pagamento com PIX foi desenvolvido pelo Banco Central.</p></div>
                    </div>
                    <div className="v2-total-pix" style={{ color: cor }}>Total à vista no PIX: R$ {plano.preco.toFixed(2)}</div>
                  </div>
                )}

                <div className="v2-total-row">
                  <span>Valor total : <strong style={{ color: cor }}>R$ {plano.preco.toFixed(2)}</strong></span>
                  {formData.metodoPagamento === 'PIX' && <span className="v2-frete-txt">Você está pagando apenas o frete.</span>}
                </div>

                <button className="v2-btn-comprar" style={{ background: cor }} onClick={finalizarPedido} disabled={processando}>
                  {processando ? 'PROCESSANDO...' : 'COMPRAR AGORA'}
                </button>
                <div className="v2-seguro-txt">🔒 Ambiente criptografado e 100% seguro.</div>
                <button className="v2-btn-voltar v2-voltar-center" onClick={() => setEtapa(plano.checkoutPedirEndereco ? 2 : 1)}>← Voltar</button>
              </div>
            )}
          </div>

          {plano.checkoutLogoInferior && (
            <div className="v2-logo-bottom"><img src={plano.checkoutLogoInferior} alt="Logo" /></div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .v2-page { min-height: 100vh; background: #f3f4f6; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .v2-wrap { max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
        .v2-logo { text-align: center; padding: 8px 0; }
        .v2-logo img { height: 56px; }
        .v2-banner { border-radius: 12px; overflow: hidden; }
        .v2-banner img { width: 100%; display: block; }
        .v2-crono { border-radius: 12px; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; color: white; font-size: 14px; }
        .v2-crono strong { font-size: 28px; font-weight: 800; letter-spacing: 2px; }
        .v2-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
        .v2-prod-row { display: flex; gap: 16px; align-items: center; }
        .v2-prod-img { width: 72px; height: 72px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .v2-prod-solo { text-align: center; }
        .v2-prod-nome { font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 4px; }
        .v2-prod-preco { font-size: 22px; font-weight: 800; }
        .v2-step-block { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
        .v2-step-head { display: flex; align-items: center; gap: 12px; padding: 14px 20px; color: white; }
        .v2-step-num { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; flex-shrink: 0; }
        .v2-step-label { font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
        .v2-step-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .v2-field { display: flex; flex-direction: column; gap: 6px; }
        .v2-field label { font-size: 11px; font-weight: 700; color: #6b7280; letter-spacing: 0.5px; }
        .v2-buscando { color: #16a34a; font-weight: 400; margin-left: 8px; }
        .v2-input-wrap { display: flex; align-items: center; border: 1.5px solid #e5e7eb; border-radius: 10px; overflow: hidden; background: white; transition: border-color 0.2s; }
        .v2-input-wrap:focus-within { border-color: #16a34a; }
        .v2-input-icon { padding: 12px 8px 12px 14px; font-size: 15px; }
        .v2-input-wrap input { flex: 1; padding: 14px 14px 14px 4px; border: none; outline: none; font-size: 15px; color: #111827; background: transparent; }
        .v2-row { display: flex; gap: 12px; }
        .v2-btn-continuar { width: 100%; padding: 15px; border: none; border-radius: 10px; color: white; font-size: 15px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; transition: opacity 0.2s; }
        .v2-btn-continuar:hover { opacity: 0.9; }
        .v2-btn-row { display: flex; gap: 10px; }
        .v2-btn-voltar { padding: 14px 20px; border: 1.5px solid #e5e7eb; border-radius: 10px; background: white; color: #6b7280; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .v2-btn-voltar:hover { border-color: #d1d5db; background: #f9fafb; }
        .v2-voltar-center { width: 100%; text-align: center; }
        .v2-metodos { display: flex; gap: 10px; flex-wrap: wrap; }
        .v2-metodo-tab { flex: 1; min-width: 100px; padding: 12px 8px; border: 2px solid #e5e7eb; border-radius: 10px; background: white; font-size: 13px; font-weight: 600; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; }
        .v2-metodo-ativo { background: #f0fdf4; }
        .v2-pix-info { display: flex; flex-direction: column; gap: 14px; padding: 16px; background: #f0fdf4; border-radius: 10px; }
        .v2-pix-item { display: flex; gap: 12px; align-items: flex-start; }
        .v2-pix-check { font-size: 16px; font-weight: 800; flex-shrink: 0; margin-top: 2px; }
        .v2-pix-item strong { display: block; font-size: 13px; margin-bottom: 2px; }
        .v2-pix-item p { font-size: 12px; color: #4b5563; line-height: 1.4; }
        .v2-total-pix { font-size: 14px; font-weight: 700; border-top: 1px solid #bbf7d0; padding-top: 12px; }
        .v2-total-row { display: flex; flex-direction: column; gap: 4px; }
        .v2-total-row span { font-size: 15px; color: #374151; }
        .v2-frete-txt { font-size: 12px; color: #9ca3af; }
        .v2-btn-comprar { width: 100%; padding: 18px; border: none; border-radius: 10px; color: white; font-size: 17px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px; transition: opacity 0.2s; }
        .v2-btn-comprar:hover:not(:disabled) { opacity: 0.9; }
        .v2-btn-comprar:disabled { opacity: 0.6; cursor: not-allowed; }
        .v2-seguro-txt { text-align: center; font-size: 12px; color: #9ca3af; }
        .v2-logo-bottom { text-align: center; padding: 8px 0; opacity: 0.6; }
        .v2-logo-bottom img { height: 40px; }
      `}</style>
    </>
  );
}