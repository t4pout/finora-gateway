'use client';
import { useState } from 'react';

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
  produto: { id: string; nome: string; descricao: string; imagem: string; tipo?: string; };
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
  const cor = plano.checkoutCorPrimaria || '#7c3aed';
  const [metodoPag, setMetodoPag] = useState(formData.metodoPagamento || 'CARTAO');
  const [cartaoData, setCartaoData] = useState({ numero: '', nome: '', validade: '', cvv: '', parcelas: '1' });
  const [flipCard, setFlipCard] = useState(false);

  const isProdutoDigital = plano?.produto?.tipo === 'DIGITAL';

  const totalComBumps = plano.preco + (plano.orderBumps
    ? plano.orderBumps.filter(ob => orderBumpsSelecionados.includes(ob.orderBump.id)).reduce((acc, ob) => acc + ob.orderBump.preco, 0)
    : 0);

  const formatarNumeroCartao = (num: string) => {
    const limpo = num.replace(/\D/g, '').slice(0, 16);
    return limpo.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatarValidade = (val: string) => {
    const limpo = val.replace(/\D/g, '').slice(0, 4);
    if (limpo.length > 2) return limpo.slice(0, 2) + '/' + limpo.slice(2);
    return limpo;
  };

  const avancarEtapa1 = async () => {
    if (!formData.nome || !formData.email || !formData.telefone) { alert('Preencha todos os campos obrigatórios'); return; }
    if (!formData.cpf || !validarCPF(formData.cpf)) { alert('CPF inválido!'); return; }
    try {
      await fetch('/api/carrinho-abandonado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compradorNome: formData.nome,
          compradorEmail: formData.email,
          compradorTel: formData.telefone,
          compradorCpf: formData.cpf,
          planoId: plano?.id,
          utmSource: '', utmMedium: '', utmCampaign: ''
        })
      });
    } catch (e) { console.error(e); }
    setEtapa((!isProdutoDigital && plano?.checkoutPedirEndereco) ? 2 : 3);
  };

  const handleFinalizar = () => {
    setFormData({ ...formData, metodoPagamento: metodoPag });
    finalizarPedido();
  };

  // Detectar bandeira do cartão
  const getBandeira = (num: string) => {
    const n = num.replace(/\D/g, '');
    if (/^4/.test(n)) return 'VISA';
    if (/^5[1-5]/.test(n)) return 'MASTER';
    if (/^3[47]/.test(n)) return 'AMEX';
    if (/^6011/.test(n)) return 'DISCOVER';
    return '';
  };

  const bandeira = getBandeira(cartaoData.numero);

  return (
    <>
      <div className="v2-page">
        {plano.checkoutLogoSuperior && (
          <div className="v2-logo-top"><img src={plano.checkoutLogoSuperior} alt="Logo" /></div>
        )}

        {plano.checkoutBanner && (
          <div className="v2-banner"><img src={plano.checkoutBanner} alt="Banner" /></div>
        )}

        {plano.checkoutCronometro && tempoRestante > 0 && (
          <div className="v2-timer">
            <span>⏰ {plano.checkoutMensagemUrgencia || 'Oferta expira em:'}</span>
            <strong>{formatarTempo(tempoRestante)}</strong>
          </div>
        )}

        <div className="v2-main">
          {/* COLUNA ESQUERDA — DADOS */}
          <div className="v2-col-left">
            <div className="v2-box">
              <div className="v2-box-title" style={{ borderColor: cor }}>
                <span className="v2-num" style={{ background: cor }}>1</span>
                Dados Cadastrais
              </div>
              <div className="v2-form">
                <div className="v2-field">
                  <label>Nome Completo *</label>
                  <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Digite seu nome completo" className="v2-input" />
                </div>
                <div className="v2-field">
                  <label>E-mail *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="seu@email.com" className="v2-input" />
                </div>
                <div className="v2-row">
                  <div className="v2-field">
                    <label>Telefone *</label>
                    <input type="tel" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} placeholder="(00) 00000-0000" className="v2-input" />
                  </div>
                  <div className="v2-field">
                    <label>CEP</label>
                    <input type="text" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} placeholder="00000-000" className="v2-input" maxLength={9} />
                  </div>
                </div>
                {!isProdutoDigital && plano.checkoutPedirEndereco && (
                  <>
                    <div className="v2-field">
                      <label>Endereço *</label>
                      <input type="text" value={formData.rua} onChange={e => setFormData({...formData, rua: e.target.value})} placeholder="Nome da rua" className="v2-input" />
                    </div>
                    <div className="v2-row">
                      <div className="v2-field" style={{maxWidth:'120px'}}>
                        <label>Número *</label>
                        <input type="text" value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} placeholder="123" className="v2-input" />
                      </div>
                      <div className="v2-field">
                        <label>Complemento</label>
                        <input type="text" value={formData.complemento} onChange={e => setFormData({...formData, complemento: e.target.value})} placeholder="S/N" className="v2-input" />
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
                        <label>Estado *</label>
                        <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="v2-input">
                          <option value="">UF</option>
                          {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA — PAGAMENTO */}
          <div className="v2-col-right">
            <div className="v2-box">
              <div className="v2-box-title" style={{ borderColor: cor }}>
                <span className="v2-num" style={{ background: cor }}>2</span>
                Pagamento
              </div>

              {/* TABS DE MÉTODO */}
              <div className="v2-tabs">
                {plano.checkoutAceitaCartao && (
                  <button onClick={() => setMetodoPag('CARTAO')} className={`v2-tab ${metodoPag === 'CARTAO' ? 'v2-tab-ativo' : ''}`} style={metodoPag === 'CARTAO' ? { borderColor: cor, color: cor } : {}}>
                    <span>💳</span> Cartão
                  </button>
                )}
                {plano.checkoutAceitaPix && (
                  <button onClick={() => setMetodoPag('PIX')} className={`v2-tab ${metodoPag === 'PIX' ? 'v2-tab-ativo' : ''}`} style={metodoPag === 'PIX' ? { borderColor: cor, color: cor } : {}}>
                    <img src="https://logodownload.org/wp-content/uploads/2020/02/pix-bc-logo-0.png" alt="PIX" style={{width:'20px', height:'20px', objectFit:'contain'}} /> PIX
                  </button>
                )}
                {plano.checkoutAceitaBoleto && (
                  <button onClick={() => setMetodoPag('BOLETO')} className={`v2-tab ${metodoPag === 'BOLETO' ? 'v2-tab-ativo' : ''}`} style={metodoPag === 'BOLETO' ? { borderColor: cor, color: cor } : {}}>
                    <span>📄</span> Boleto
                  </button>
                )}
              </div>

              {/* CARTÃO ANIMADO */}
              {metodoPag === 'CARTAO' && (
                <div className="v2-cartao-section">
                  <div className={`v2-card-visual ${flipCard ? 'flipped' : ''}`}>
                    <div className="v2-card-front" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}99)` }}>
                      <div className="v2-card-chip">
                        <div className="v2-chip-lines"></div>
                      </div>
                      <div className="v2-card-numero">
                        {cartaoData.numero ? cartaoData.numero.padEnd(19, ' ').replace(/ /g, cartaoData.numero.length < 19 ? '•' : ' ') : '•••• •••• •••• ••••'}
                      </div>
                      <div className="v2-card-bottom">
                        <div>
                          <div className="v2-card-label">TITULAR</div>
                          <div className="v2-card-value">{cartaoData.nome || 'NOME COMPLETO'}</div>
                        </div>
                        <div>
                          <div className="v2-card-label">VALIDADE</div>
                          <div className="v2-card-value">{cartaoData.validade || 'MM/AA'}</div>
                        </div>
                        <div className="v2-card-bandeira">
                          {bandeira === 'VISA' && <span style={{color:'white', fontWeight:'900', fontStyle:'italic', fontSize:'22px'}}>VISA</span>}
                          {bandeira === 'MASTER' && <div style={{display:'flex'}}><div style={{width:'28px',height:'28px',borderRadius:'50%',background:'#eb001b',opacity:0.9}}></div><div style={{width:'28px',height:'28px',borderRadius:'50%',background:'#f79e1b',marginLeft:'-12px',opacity:0.9}}></div></div>}
                          {!bandeira && <span style={{color:'rgba(255,255,255,0.5)', fontSize:'12px'}}>BANDEIRA</span>}
                        </div>
                      </div>
                    </div>
                    <div className="v2-card-back" style={{ background: `linear-gradient(135deg, #1f2937, #374151)` }}>
                      <div className="v2-card-tarja"></div>
                      <div className="v2-card-cvv-area">
                        <div className="v2-card-cvv-label">CVV</div>
                        <div className="v2-card-cvv-box">{cartaoData.cvv || '•••'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="v2-form" style={{marginTop:'16px'}}>
                    <div className="v2-field">
                      <label>Número do Cartão *</label>
                      <input type="text" value={cartaoData.numero} onChange={e => setCartaoData({...cartaoData, numero: formatarNumeroCartao(e.target.value)})} placeholder="Digite somente os números" className="v2-input" maxLength={19} />
                    </div>
                    <div className="v2-field">
                      <label>Titular do Cartão *</label>
                      <input type="text" value={cartaoData.nome} onChange={e => setCartaoData({...cartaoData, nome: e.target.value.toUpperCase()})} placeholder="Nome impresso no cartão" className="v2-input" />
                    </div>
                    <div className="v2-row">
                      <div className="v2-field">
                        <label>CPF/CNPJ do Titular *</label>
                        <input type="text" value={formData.cpf} onChange={e => {
                          let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                          if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                          else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
                          else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
                          setFormData({...formData, cpf: v});
                        }} placeholder="000.000.000-00" className="v2-input" maxLength={14} />
                      </div>
                    </div>
                    <div className="v2-row">
                      <div className="v2-field">
                        <label>Validade *</label>
                        <input type="text" value={cartaoData.validade} onChange={e => setCartaoData({...cartaoData, validade: formatarValidade(e.target.value)})} placeholder="MM/AA" className="v2-input" maxLength={5} />
                      </div>
                      <div className="v2-field">
                        <label>CVV *</label>
                        <input type="text" value={cartaoData.cvv} onFocus={() => setFlipCard(true)} onBlur={() => setFlipCard(false)} onChange={e => setCartaoData({...cartaoData, cvv: e.target.value.replace(/\D/g,'').slice(0,4)})} placeholder="CVV" className="v2-input" maxLength={4} />
                      </div>
                    </div>
                    <div className="v2-field">
                      <label>Parcelamento</label>
                      <select value={cartaoData.parcelas} onChange={e => setCartaoData({...cartaoData, parcelas: e.target.value})} className="v2-input">
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                          <option key={n} value={n}>{n}x de R$ {(totalComBumps / n).toFixed(2).replace('.', ',')}{n === 1 ? ' sem juros' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* PIX */}
              {metodoPag === 'PIX' && (
                <div className="v2-pix-section">
                  <div className="v2-pix-icon">
                    <img src="https://logodownload.org/wp-content/uploads/2020/02/pix-bc-logo-0.png" alt="PIX" style={{width:'64px', height:'64px', objectFit:'contain'}} />
                  </div>
                  <h3 className="v2-pix-titulo">Libere sua compra rapidamente pagando com o Pix!</h3>
                  <div className="v2-pix-steps">
                    <div className="v2-pix-step"><span style={{color: cor}}>1</span> Pagamento em segundos, sem complicação</div>
                    <div className="v2-pix-step"><span style={{color: cor}}>2</span> Basta escanear o QR Code com o aplicativo do seu banco</div>
                    <div className="v2-pix-step"><span style={{color: cor}}>3</span> O PIX foi desenvolvido pelo Banco Central e é 100% seguro</div>
                  </div>
                  <div className="v2-pix-valor" style={{color: cor}}>R$ {totalComBumps.toFixed(2).replace('.', ',')}</div>
                  <div className="v2-field" style={{marginTop:'12px'}}>
                    <label>CPF/CNPJ *</label>
                    <input type="text" value={formData.cpf} onChange={e => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                      if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                      else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
                      else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
                      setFormData({...formData, cpf: v});
                    }} placeholder="Digite o CPF / CNPJ" className="v2-input" maxLength={14} />
                  </div>
                </div>
              )}

              {/* BOLETO */}
              {metodoPag === 'BOLETO' && (
                <div className="v2-boleto-section">
                  <div className="v2-boleto-icon">📄</div>
                  <h3 className="v2-boleto-titulo">Boleto Bancário</h3>
                  <div className="v2-boleto-valor" style={{color: cor}}>R$ {totalComBumps.toFixed(2).replace('.', ',')}</div>
                  <div className="v2-boleto-avisos">
                    <div className="v2-boleto-aviso">⚠️ O boleto vence em <strong>3 dias úteis</strong></div>
                    <div className="v2-boleto-aviso">⏳ A confirmação pode levar <strong>até 3 dias úteis</strong> após o pagamento</div>
                    <div className="v2-boleto-aviso">📧 O boleto será enviado para seu <strong>e-mail</strong></div>
                    <div className="v2-boleto-aviso">🏦 Pague em qualquer <strong>banco, lotérica ou app</strong></div>
                  </div>
                  <div className="v2-field" style={{marginTop:'12px'}}>
                    <label>CPF/CNPJ *</label>
                    <input type="text" value={formData.cpf} onChange={e => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                      if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                      else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
                      else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
                      setFormData({...formData, cpf: v});
                    }} placeholder="Digite o CPF / CNPJ" className="v2-input" maxLength={14} />
                  </div>
                </div>
              )}

              {/* ORDER BUMPS */}
              {plano.orderBumps && plano.orderBumps.length > 0 && (
                <div className="v2-ob-section">
                  <p className="v2-ob-titulo">🎁 Adicione ao seu pedido:</p>
                  {plano.orderBumps.map((ob) => (
                    <label key={ob.orderBump.id} className={`v2-ob-card ${orderBumpsSelecionados.includes(ob.orderBump.id) ? 'v2-ob-ativo' : ''}`} style={orderBumpsSelecionados.includes(ob.orderBump.id) ? { borderColor: cor, background: cor + '10' } : {}}>
                      <input type="checkbox" checked={orderBumpsSelecionados.includes(ob.orderBump.id)} onChange={(e) => {
                        if (e.target.checked) setOrderBumpsSelecionados([...orderBumpsSelecionados, ob.orderBump.id]);
                        else setOrderBumpsSelecionados(orderBumpsSelecionados.filter(id => id !== ob.orderBump.id));
                      }} className="v2-ob-checkbox" />
                      {ob.orderBump.imagem && <img src={ob.orderBump.imagem} alt={ob.orderBump.titulo} className="v2-ob-imagem" />}
                      <div className="v2-ob-info">
                        <div className="v2-ob-nome">{ob.orderBump.titulo}</div>
                        {ob.orderBump.descricao && <div className="v2-ob-desc">{ob.orderBump.descricao}</div>}
                      </div>
                      <div className="v2-ob-preco" style={{ color: cor }}>+ R$ {ob.orderBump.preco.toFixed(2).replace('.', ',')}</div>
                    </label>
                  ))}
                  {orderBumpsSelecionados.length > 0 && (
                    <div className="v2-ob-total">Total: <strong>R$ {totalComBumps.toFixed(2).replace('.', ',')}</strong></div>
                  )}
                </div>
              )}

              {/* BOTÃO CONFIRMAR */}
              <button onClick={handleFinalizar} disabled={processando} className="v2-btn-confirmar" style={{ background: processando ? '#ccc' : '#16a34a' }}>
                {processando ? 'Processando...' : metodoPag === 'PIX' ? '🟢 Gerar Pix copia e cola' : metodoPag === 'BOLETO' ? '📄 Gerar Boleto' : '🔒 Confirmar Pagamento'}
              </button>

              <div className="v2-seguro">
                <img src="https://img.icons8.com/color/48/lock--v1.png" alt="Seguro" style={{width:'24px', height:'24px'}} />
                <div>
                  <div className="v2-seguro-titulo">VOCÊ ESTÁ EM AMBIENTE SEGURO</div>
                  <div className="v2-seguro-sub">✓ SSL Criptografia 128 bits</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {plano.checkoutLogoInferior && (
          <div className="v2-logo-bottom"><img src={plano.checkoutLogoInferior} alt="Logo" /></div>
        )}
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .v2-page { min-height: 100vh; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
        .v2-logo-top { text-align: center; margin-bottom: 20px; }
        .v2-logo-top img { height: 56px; }
        .v2-banner { margin-bottom: 20px; border-radius: 12px; overflow: hidden; max-width: 960px; margin-left: auto; margin-right: auto; }
        .v2-banner img { width: 100%; display: block; }
        .v2-timer { background: #dc2626; color: white; border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; font-size: 14px; max-width: 960px; margin-left: auto; margin-right: auto; }
        .v2-timer strong { font-size: 28px; letter-spacing: 2px; }
        .v2-main { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 960px; margin: 0 auto; align-items: start; }
        .v2-col-left, .v2-col-right { display: flex; flex-direction: column; gap: 16px; }
        .v2-box { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .v2-box-title { padding: 14px 20px; font-size: 15px; font-weight: 700; color: #111; display: flex; align-items: center; gap: 10px; border-left: 4px solid; border-bottom: 1px solid #f0f0f0; }
        .v2-num { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: white; flex-shrink: 0; }
        .v2-form { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
        .v2-field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
        .v2-field label { font-size: 12px; font-weight: 600; color: #555; }
        .v2-input { padding: 10px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; width: 100%; }
        .v2-input:focus { border-color: #6b7280; }
        .v2-row { display: flex; gap: 10px; }
        .v2-tabs { display: flex; gap: 8px; padding: 14px 20px 0; }
        .v2-tab { flex: 1; padding: 10px 8px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; font-size: 13px; font-weight: 600; color: #666; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; }
        .v2-tab:hover { border-color: #9ca3af; }
        .v2-tab-ativo { font-weight: 700; }

        /* CARTÃO ANIMADO */
        .v2-cartao-section { padding: 16px 20px; }
        .v2-card-visual { width: 100%; max-width: 320px; height: 180px; margin: 0 auto; perspective: 1000px; position: relative; }
        .v2-card-front, .v2-card-back { position: absolute; width: 100%; height: 100%; border-radius: 16px; padding: 20px; backface-visibility: hidden; transition: transform 0.6s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .v2-card-front { color: white; }
        .v2-card-back { transform: rotateY(180deg); }
        .v2-card-visual.flipped .v2-card-front { transform: rotateY(-180deg); }
        .v2-card-visual.flipped .v2-card-back { transform: rotateY(0deg); }
        .v2-card-chip { width: 42px; height: 32px; background: linear-gradient(135deg, #d4af37, #f5d97d); border-radius: 6px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; }
        .v2-chip-lines { width: 30px; height: 20px; background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px); border-radius: 2px; }
        .v2-card-numero { font-size: 17px; font-weight: 600; letter-spacing: 2px; margin-bottom: 16px; font-family: monospace; }
        .v2-card-bottom { display: flex; align-items: flex-end; justify-content: space-between; }
        .v2-card-label { font-size: 9px; opacity: 0.7; text-transform: uppercase; margin-bottom: 2px; }
        .v2-card-value { font-size: 13px; font-weight: 600; text-transform: uppercase; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .v2-card-bandeira { display: flex; align-items: center; }
        .v2-card-tarja { height: 44px; background: #111; margin: -20px -20px 16px; }
        .v2-card-cvv-area { display: flex; align-items: center; gap: 12px; justify-content: flex-end; }
        .v2-card-cvv-label { color: white; font-size: 12px; opacity: 0.7; }
        .v2-card-cvv-box { background: white; color: #333; padding: 6px 16px; border-radius: 4px; font-size: 16px; font-weight: 700; letter-spacing: 3px; min-width: 60px; text-align: center; }

        /* PIX */
        .v2-pix-section { padding: 20px; text-align: center; }
        .v2-pix-icon { margin-bottom: 12px; }
        .v2-pix-titulo { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 16px; line-height: 1.4; }
        .v2-pix-steps { text-align: left; display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .v2-pix-step { font-size: 13px; color: #555; display: flex; gap: 8px; }
        .v2-pix-step span { font-weight: 700; }
        .v2-pix-valor { font-size: 32px; font-weight: 800; }

        /* BOLETO */
        .v2-boleto-section { padding: 20px; text-align: center; }
        .v2-boleto-icon { font-size: 48px; margin-bottom: 8px; }
        .v2-boleto-titulo { font-size: 18px; font-weight: 700; color: #111; margin-bottom: 8px; }
        .v2-boleto-valor { font-size: 32px; font-weight: 800; margin-bottom: 16px; }
        .v2-boleto-avisos { display: flex; flex-direction: column; gap: 8px; text-align: left; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; }
        .v2-boleto-aviso { font-size: 13px; color: #78350f; }

        /* ORDER BUMPS */
        .v2-ob-section { padding: 0 20px 16px; display: flex; flex-direction: column; gap: 10px; }
        .v2-ob-titulo { font-size: 14px; font-weight: 700; color: #111; }
        .v2-ob-card { display: flex; align-items: center; gap: 12px; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; transition: all 0.2s; background: white; }
        .v2-ob-card:hover { border-color: #9ca3af; }
        .v2-ob-ativo { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .v2-ob-checkbox { width: 18px; height: 18px; flex-shrink: 0; cursor: pointer; }
        .v2-ob-imagem { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .v2-ob-info { flex: 1; }
        .v2-ob-nome { font-size: 13px; font-weight: 700; color: #111; }
        .v2-ob-desc { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .v2-ob-preco { font-size: 14px; font-weight: 800; white-space: nowrap; }
        .v2-ob-total { padding: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534; font-size: 13px; text-align: center; }

        /* BOTÃO E SEGURO */
        .v2-btn-confirmar { width: calc(100% - 40px); margin: 0 20px 16px; padding: 16px; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; color: white; cursor: pointer; transition: opacity 0.2s; display: block; }
        .v2-btn-confirmar:hover:not(:disabled) { opacity: 0.9; }
        .v2-btn-confirmar:disabled { opacity: 0.6; cursor: not-allowed; }
        .v2-seguro { display: flex; align-items: center; gap: 10px; padding: 12px 20px; background: #f0fdf4; border-top: 1px solid #e5e7eb; }
        .v2-seguro-titulo { font-size: 11px; font-weight: 700; color: #166534; }
        .v2-seguro-sub { font-size: 11px; color: #15803d; }
        .v2-logo-bottom { text-align: center; margin-top: 20px; opacity: 0.6; }
        .v2-logo-bottom img { height: 40px; }

        @media (max-width: 768px) {
          .v2-main { grid-template-columns: 1fr; }
          .v2-page { padding: 12px; }
          .v2-row { flex-direction: column; }
        }
      `}</style>
    </>
  );
}