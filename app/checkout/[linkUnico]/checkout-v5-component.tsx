'use client';
import { useState, useEffect } from 'react';
import { calcularValorComCondicao } from '@/lib/condicao-desconto';

interface OpcaoFrete {
  id: string;
  nome: string;
  descricao: string | null;
  prazoDias: number;
  preco: number;
  ativo: boolean;
}

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
  checkoutCondicaoDesconto?: any;
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
  finalizarPedido: (override?: any) => void;
  validarCPF: (cpf: string) => boolean;
  formatarTempo: (s: number) => string;
  orderBumpsSelecionados: string[];
  setOrderBumpsSelecionados: (ids: string[]) => void;
  quantidade: number;
  setQuantidade: (n: number) => void;
}

export default function CheckoutV5({ plano, formData, setFormData, etapa, setEtapa, processando, buscandoCep, tempoRestante, finalizarPedido, validarCPF, formatarTempo, orderBumpsSelecionados, setOrderBumpsSelecionados, quantidade, setQuantidade }: Props) {
  const cor = plano.checkoutCorPrimaria || '#2e7d32';
  const [metodoPag, setMetodoPag] = useState(formData.metodoPagamento || 'CARTAO');
  const [cartaoData, setCartaoData] = useState({ numero: '', nome: '', validade: '', cvv: '', parcelas: '1' });
  const [flipCard, setFlipCard] = useState(false);

  const isProdutoDigital = plano?.produto?.tipo === 'DIGITAL';
  const precisaEndereco = !isProdutoDigital && plano?.checkoutPedirEndereco;
  const etapaPagamento = precisaEndereco ? 3 : 2;
  const totalEtapas = precisaEndereco ? 3 : 2;

  const [fretes, setFretes] = useState<OpcaoFrete[]>([]);
  const [freteSelecionadoId, setFreteSelecionadoId] = useState<string>('');
  const [carregandoFretes, setCarregandoFretes] = useState(false);
  const [enderecoExpandido, setEnderecoExpandido] = useState(false);

  useEffect(() => {
    if (!precisaEndereco || !plano?.produto?.id) return;
    const carregarFretes = async () => {
      setCarregandoFretes(true);
      try {
        const res = await fetch(`/api/produto/${plano.produto.id}/fretes`);
        if (res.ok) {
          const data = await res.json();
          const ativos = (data || []).filter((f: OpcaoFrete) => f.ativo);
          setFretes(ativos);
          if (ativos.length > 0) {
            setFreteSelecionadoId(ativos[0].id);
          }
        }
      } catch (e) { console.error('Erro ao carregar fretes:', e); }
      setCarregandoFretes(false);
    };
    carregarFretes();
  }, [plano?.produto?.id, precisaEndereco]);

  useEffect(() => {
    const cepLimpo = (formData.cep || '').replace(/\D/g, '');
    if (cepLimpo.length === 8 && formData.rua) {
      setEnderecoExpandido(true);
    }
  }, [formData.rua, formData.cep]);
  
  useEffect(() => {
    if (!enderecoExpandido || fretes.length === 0) return;
    const freteAtual = fretes.find(f => f.id === freteSelecionadoId) || fretes[0];
    if (freteAtual) {
      setFormData((prev: any) => ({ ...prev, freteValor: freteAtual.preco, freteNome: freteAtual.nome }));
    }
  }, [enderecoExpandido, fretes]);

  const selecionarFrete = (f: OpcaoFrete) => {
    setFreteSelecionadoId(f.id);
    setFormData((prev: any) => ({ ...prev, freteValor: f.preco, freteNome: f.nome }));
  };

  const orderBumpsValor = plano.orderBumps
    ? plano.orderBumps.filter(ob => orderBumpsSelecionados.includes(ob.orderBump.id)).reduce((acc, ob) => acc + ob.orderBump.preco, 0)
    : 0;
  const freteValorAtual = precisaEndereco ? (Number(formData.freteValor) || 0) : 0;
  const valorProdutos = calcularValorComCondicao(plano.preco, quantidade, plano.checkoutCondicaoDesconto);
  const totalGeral = valorProdutos + orderBumpsValor + freteValorAtual;

  const formatarNumeroCartao = (num: string) => {
    const limpo = num.replace(/\D/g, '').slice(0, 16);
    return limpo.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatarValidade = (val: string) => {
    const limpo = val.replace(/\D/g, '').slice(0, 4);
    if (limpo.length > 2) return limpo.slice(0, 2) + '/' + limpo.slice(2);
    return limpo;
  };

  const formatarCPF = (v: string) => {
    let val = v.replace(/\D/g, '').slice(0, 11);
    if (val.length > 9) val = val.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    else if (val.length > 6) val = val.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    else if (val.length > 3) val = val.replace(/(\d{3})(\d+)/, '$1.$2');
    return val;
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
    setEtapa(precisaEndereco ? 2 : 3);
  };

  const avancarEtapa2 = () => {
    if (!formData.rua || !formData.numero || !formData.bairro) { alert('Preencha o endereço completo'); return; }
    setEtapa(3);
  };

  const handleFinalizar = async () => {
    const novoFormData = {
      ...formData,
      metodoPagamento: metodoPag,
      cartaoNumero: cartaoData.numero.replace(/\D/g, ''),
      cartaoNome: cartaoData.nome,
      cartaoMes: cartaoData.validade.split('/')[0] || '',
      cartaoAno: cartaoData.validade.split('/')[1] || '',
      cartaoCvv: cartaoData.cvv,
      parcelas: cartaoData.parcelas
    };
    setFormData(novoFormData);
    finalizarPedido(novoFormData);
  };

  const orderBumpBlock = plano.orderBumps && plano.orderBumps.length > 0 && (
    <div className="v5-ob-embutido">
      <div className="v5-ob-selo">Oferta{plano.orderBumps.length > 1 ? 's' : ''} especial{plano.orderBumps.length > 1 ? 'is' : ''} pra você</div>
      {plano.orderBumps.map((ob) => {
        const selecionado = orderBumpsSelecionados.includes(ob.orderBump.id);
        return (
          <label key={ob.orderBump.id} className={`v5-ob-card ${selecionado ? 'v5-ob-card-ativo' : ''}`} style={selecionado ? { borderColor: cor } : {}}>
            <input type="checkbox" checked={selecionado} className="v5-ob-checkbox" onChange={(e) => {
              if (e.target.checked) setOrderBumpsSelecionados([...orderBumpsSelecionados, ob.orderBump.id]);
              else setOrderBumpsSelecionados(orderBumpsSelecionados.filter(id => id !== ob.orderBump.id));
            }} />
            {ob.orderBump.imagem ? (
              <img src={ob.orderBump.imagem} alt={ob.orderBump.titulo} className="v5-ob-imagem" />
            ) : (
              <div className="v5-ob-imagem-placeholder">📦</div>
            )}
            <div className="v5-ob-info">
              <div className="v5-ob-nome">{ob.orderBump.titulo}</div>
              {ob.orderBump.descricao && <div className="v5-ob-desc">{ob.orderBump.descricao}</div>}
            </div>
            <div className="v5-ob-preco" style={{ color: cor }}>+ R$ {ob.orderBump.preco.toFixed(2).replace('.', ',')}</div>
          </label>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="v5-page">
        {plano.checkoutLogoSuperior && (
          <div className="v5-logo-top"><img src={plano.checkoutLogoSuperior} alt="Logo" /></div>
        )}

        {plano.checkoutBanner && (
          <div className="v5-banner"><img src={plano.checkoutBanner} alt="Banner" /></div>
        )}

        {plano.checkoutCronometro && tempoRestante > 0 && (
          <div className="v5-faixa">
            <div className="v5-faixa-topo">ENVIO IMEDIATO, COM RASTREIO E NOTA FISCAL!</div>
            <div className="v5-faixa-meio">✅ Compra segura + garantia de 30 dias. Finalize agora sem risco!</div>
            <div className="v5-faixa-baixo">⏱️ {plano.checkoutMensagemUrgencia || 'Oferta termina em'} <strong>{formatarTempo(tempoRestante)}</strong></div>
          </div>
        )}

        <div className="v5-grid">
          {/* COLUNA 1 — IDENTIFICAÇÃO + ENTREGA */}
          <div className="v5-col">
            <div className={`v5-box ${etapa > 1 ? 'v5-box-completo' : ''}`}>
              <div className="v5-box-header">
                <h3>Identificação</h3>
                {etapa === 1 ? <span className="v5-box-etapa">1 de {totalEtapas}</span> : (
                  <button className="v5-box-editar" onClick={() => setEtapa(1)}>✎</button>
                )}
              </div>
              {etapa === 1 ? (
                <div className="v5-form">
                  <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} placeholder="Nome completo" className="v5-input" />
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="E-mail" className="v5-input" />
                  <input type="text" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: formatarCPF(e.target.value)})} placeholder="CPF" className="v5-input" maxLength={14} />
                  <input type="tel" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} placeholder="WhatsApp/Celular" className="v5-input" />
                  <button onClick={avancarEtapa1} className="v5-btn-continuar" style={{ background: cor }}>Ir para {precisaEndereco ? 'Entrega' : 'Pagamento'}</button>
                  <p className="v5-termos">Ao prosseguir com a compra, você concorda com as <a href="#">Políticas de Privacidade</a></p>
                </div>
              ) : (
                <div className="v5-resumo-identificacao">
                  <strong>{formData.nome}</strong>
                  <div>{formData.email}</div>
                  <div>CPF {formData.cpf}</div>
                </div>
              )}
            </div>

            {precisaEndereco && (
              <div className={`v5-box ${etapa === 1 ? 'v5-box-desativado' : ''} ${etapa > 2 ? 'v5-box-completo' : ''}`}>
                <div className="v5-box-header">
                  <h3>Entrega</h3>
                  <span className="v5-box-etapa">2 de 3</span>
                </div>
                {etapa === 1 && <p className="v5-aviso-etapa">Preencha suas informações de entrega para continuar</p>}
                {etapa === 2 && (
                  <div className="v5-form">
                    <div className="v5-row">
                      <input type="text" value={formData.cep} onChange={(e) => setFormData({...formData, cep: e.target.value})} placeholder="CEP" className="v5-input" maxLength={9} />
                      {buscandoCep && <span className="v5-loading-cep">Buscando...</span>}
                    </div>
                    {enderecoExpandido && (
                      <>
                        <input type="text" value={formData.rua} onChange={(e) => setFormData({...formData, rua: e.target.value})} placeholder="Endereço" className="v5-input" />
                        <div className="v5-row">
                          <input type="text" value={formData.numero} onChange={(e) => setFormData({...formData, numero: e.target.value})} placeholder="Número" className="v5-input" style={{maxWidth: '110px'}} />
                          <input type="text" value={formData.bairro} onChange={(e) => setFormData({...formData, bairro: e.target.value})} placeholder="Bairro" className="v5-input" />
                        </div>
                        <input type="text" value={formData.complemento} onChange={(e) => setFormData({...formData, complemento: e.target.value})} placeholder="Complemento (opcional)" className="v5-input" />

                        {carregandoFretes ? (
                          <p className="v5-aviso-etapa">Calculando opções de frete...</p>
                        ) : fretes.length > 0 ? (
                          <div className="v5-fretes">
                            <p className="v5-fretes-titulo">Escolha uma forma de entrega:</p>
                            {fretes.map((f) => (
                              <label key={f.id} className={`v5-frete-opcao ${freteSelecionadoId === f.id ? 'v5-frete-ativo' : ''}`} style={freteSelecionadoId === f.id ? { borderColor: cor } : {}}>
                                <input type="radio" checked={freteSelecionadoId === f.id} onChange={() => selecionarFrete(f)} />
                                <div className="v5-frete-info">
                                  <div className="v5-frete-nome">{f.nome.toUpperCase()} — {f.prazoDias} DIAS</div>
                                  {f.descricao && <div className="v5-frete-desc">{f.descricao}</div>}
                                </div>
                                <div className="v5-frete-preco">{f.preco > 0 ? `R$ ${f.preco.toFixed(2).replace('.', ',')}` : 'Grátis'}</div>
                              </label>
                            ))}
                          </div>
                        ) : null}

                        <button onClick={avancarEtapa2} className="v5-btn-continuar" style={{ background: cor }}>Ir para Pagamento</button>
                      </>
                    )}
                  </div>
                )}
                {etapa > 2 && (
                  <div className="v5-resumo-identificacao">
                    <div><strong>Endereço para entrega:</strong></div>
                    <div>{formData.rua}, {formData.numero} - {formData.bairro}</div>
                    <div>{formData.cidade}-{formData.estado} | CEP {formData.cep}</div>
                    <div style={{marginTop:'8px'}}><strong>Forma de entrega:</strong></div>
                    <div>{formData.freteNome || 'Padrão'} {freteValorAtual === 0 ? 'Grátis' : `- R$ ${freteValorAtual.toFixed(2).replace('.', ',')}`}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COLUNA 2 — PAGAMENTO */}
          <div className="v5-col">
            <div className={`v5-box ${etapa < etapaPagamento ? 'v5-box-desativado' : ''}`}>
              <div className="v5-box-header">
                <h3>Pagamento</h3>
                <span className="v5-box-etapa">{totalEtapas} de {totalEtapas}</span>
              </div>
              {etapa < etapaPagamento && <p className="v5-aviso-etapa">Preencha suas informações {precisaEndereco ? 'de entrega' : 'anteriores'} para continuar</p>}
              {etapa === etapaPagamento && (
                <div className="v5-form">
                  {plano.checkoutAceitaCartao && (
                    <label className={`v5-metodo-opcao ${metodoPag === 'CARTAO' ? 'v5-metodo-ativo' : ''}`} style={metodoPag === 'CARTAO' ? { borderColor: cor } : {}}>
                      <input type="radio" checked={metodoPag === 'CARTAO'} onChange={() => setMetodoPag('CARTAO')} />
                      <span>💳 Cartão de crédito</span>
                    </label>
                  )}
                  {metodoPag === 'CARTAO' && plano.checkoutAceitaCartao && (
                    <div className="v5-cartao-box">
                      <div className={`v5-card-visual ${flipCard ? 'flipped' : ''}`}>
                        <div className="v5-card-front" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}99)` }}>
                          <div className="v5-card-chip"></div>
                          <div className="v5-card-numero">{cartaoData.numero || '•••• •••• •••• ••••'}</div>
                          <div className="v5-card-bottom">
                            <div><div className="v5-card-label">TITULAR</div><div className="v5-card-value">{cartaoData.nome || 'NOME E SOBRENOME'}</div></div>
                            <div><div className="v5-card-label">VAL.</div><div className="v5-card-value">{cartaoData.validade || 'MM/AA'}</div></div>
                          </div>
                        </div>
                        <div className="v5-card-back">
                          <div className="v5-card-tarja"></div>
                          <div className="v5-card-cvv-box">{cartaoData.cvv || '•••'}</div>
                        </div>
                      </div>
                      <input type="text" value={cartaoData.numero} onChange={(e) => setCartaoData({...cartaoData, numero: formatarNumeroCartao(e.target.value)})} placeholder="Número do cartão" className="v5-input" maxLength={19} />
                      <div className="v5-row">
                        <input type="text" value={cartaoData.validade} onChange={(e) => setCartaoData({...cartaoData, validade: formatarValidade(e.target.value)})} placeholder="Validade (mês/ano)" className="v5-input" maxLength={5} />
                        <input type="text" value={cartaoData.cvv} onFocus={() => setFlipCard(true)} onBlur={() => setFlipCard(false)} onChange={(e) => setCartaoData({...cartaoData, cvv: e.target.value.replace(/\D/g,'').slice(0,4)})} placeholder="Cód. de segurança" className="v5-input" maxLength={4} />
                      </div>
                      <input type="text" value={cartaoData.nome} onChange={(e) => setCartaoData({...cartaoData, nome: e.target.value.toUpperCase()})} placeholder="Nome e sobrenome do titular" className="v5-input" />
                      <select value={cartaoData.parcelas} onChange={(e) => setCartaoData({...cartaoData, parcelas: e.target.value})} className="v5-input">
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                          <option key={n} value={n}>{n}x de R$ {(totalGeral / n).toFixed(2).replace('.', ',')}{n === 1 ? ' sem juros' : ''}</option>
                        ))}
                      </select>
                      {orderBumpBlock}
                    </div>
                  )}

                  {plano.checkoutAceitaPix && (
                    <label className={`v5-metodo-opcao ${metodoPag === 'PIX' ? 'v5-metodo-ativo' : ''}`} style={metodoPag === 'PIX' ? { borderColor: cor } : {}}>
                      <input type="radio" checked={metodoPag === 'PIX'} onChange={() => setMetodoPag('PIX')} />
                      <span>◈ Pix</span>
                    </label>
                  )}
                  {metodoPag === 'PIX' && plano.checkoutAceitaPix && (
                    <div className="v5-pix-box">
                      <p className="v5-pix-texto">A confirmação de pagamento é realizada em poucos minutos. Utilize o aplicativo do seu banco para pagar.</p>
                      <div className="v5-pix-valor" style={{ color: cor }}>Valor no Pix: R$ {totalGeral.toFixed(2).replace('.', ',')}</div>
                      {orderBumpBlock}
                    </div>
                  )}

                  <button onClick={handleFinalizar} disabled={processando} className="v5-btn-finalizar" style={{ background: processando ? '#9ca3af' : '#16a34a' }}>
                    {processando ? 'Processando...' : 'Finalizar compra'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA 3 — RESUMO */}
          <div className="v5-col v5-col-resumo">
            <div className="v5-resumo-box">
              <h3 className="v5-resumo-titulo">Resumo da compra</h3>
              <div className="v5-resumo-linha"><span>Produtos ({quantidade})</span><span>R$ {valorProdutos.toFixed(2).replace('.', ',')}</span></div>
              {orderBumpsValor > 0 && <div className="v5-resumo-linha"><span>Adicionais</span><span>R$ {orderBumpsValor.toFixed(2).replace('.', ',')}</span></div>}
              {precisaEndereco && <div className="v5-resumo-linha"><span>Frete</span><span>{freteValorAtual > 0 ? `R$ ${freteValorAtual.toFixed(2).replace('.', ',')}` : 'Grátis'}</span></div>}
              <div className="v5-resumo-total"><span>Total</span><span>R$ {totalGeral.toFixed(2).replace('.', ',')}</span></div>

              {plano.produto && (
                <div className="v5-resumo-produto">
                  {plano.produto.imagem ? <img src={plano.produto.imagem} alt={plano.produto.nome} className="v5-resumo-produto-img" /> : <div className="v5-resumo-produto-img-placeholder">📦</div>}
                  <div className="v5-resumo-produto-info">
                    <div className="v5-resumo-produto-nome">{quantidade}x {plano.produto.nome}</div>
                    <div className="v5-resumo-produto-valor">R$ {valorProdutos.toFixed(2).replace('.', ',')}</div>
                  </div>
                </div>
              )}
              <div className="v5-resumo-qtd">
                <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="v5-qtd-btn">−</button>
                <span className="v5-qtd-valor">{quantidade}</span>
                <button onClick={() => setQuantidade(quantidade + 1)} className="v5-qtd-btn">+</button>
              </div>
            </div>
          </div>
        </div>

        {plano.checkoutLogoInferior && (
          <div className="v5-logo-bottom"><img src={plano.checkoutLogoInferior} alt="Logo" /></div>
        )}
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .v5-page { min-height: 100vh; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .v5-logo-top { text-align: center; padding: 20px 0; background: white; }
        .v5-logo-top img { height: 44px; }
        .v5-banner { max-width: 1180px; margin: 0 auto; padding: 0 16px 16px; }
        .v5-banner img { width: 100%; border-radius: 10px; display: block; }
        .v5-faixa { background: #0c1b3a; color: white; text-align: center; padding: 16px; }
        .v5-faixa-topo { font-weight: 800; font-size: 14px; letter-spacing: 0.3px; }
        .v5-faixa-meio { font-size: 13px; margin-top: 8px; color: #d1fae5; }
        .v5-faixa-baixo { font-size: 13px; margin-top: 6px; }
        .v5-faixa-baixo strong { color: #facc15; font-size: 15px; }

        .v5-grid { max-width: 1180px; margin: 24px auto; padding: 0 16px; display: grid; grid-template-columns: 1fr 1fr 300px; gap: 20px; align-items: start; }
        .v5-col { display: flex; flex-direction: column; gap: 16px; }
        .v5-col-resumo { position: sticky; top: 20px; }

        .v5-box { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; transition: opacity 0.2s; }
        .v5-box-desativado { opacity: 0.55; pointer-events: none; }
        .v5-box-completo { border-color: #86efac; background: #f0fdf4; }
        .v5-box-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .v5-box-header h3 { font-size: 16px; font-weight: 800; color: #111827; }
        .v5-box-etapa { font-size: 12px; color: #9ca3af; font-weight: 600; }
        .v5-box-editar { background: none; border: none; cursor: pointer; font-size: 16px; color: #6b7280; }
        .v5-aviso-etapa { font-size: 13px; color: #9ca3af; }
        .v5-resumo-identificacao { font-size: 13px; color: #166534; line-height: 1.6; }
        .v5-resumo-identificacao strong { display: block; color: #111827; font-size: 14px; }

        .v5-form { display: flex; flex-direction: column; gap: 10px; }
        .v5-row { display: flex; gap: 10px; align-items: center; }
        .v5-input { padding: 11px 14px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; width: 100%; }
        .v5-input:focus { border-color: #9ca3af; }
        .v5-loading-cep { font-size: 12px; color: #6b7280; white-space: nowrap; }
        .v5-btn-continuar { padding: 14px; border: none; border-radius: 8px; color: white; font-weight: 700; font-size: 15px; cursor: pointer; margin-top: 4px; }
        .v5-termos { font-size: 11px; color: #9ca3af; text-align: center; }
        .v5-termos a { color: #6b7280; text-decoration: underline; }

        .v5-fretes { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
        .v5-fretes-titulo { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px; }
        .v5-frete-opcao { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; cursor: pointer; }
        .v5-frete-ativo { background: #f9fafb; }
        .v5-frete-info { flex: 1; }
        .v5-frete-nome { font-size: 12px; font-weight: 800; color: #111827; }
        .v5-frete-desc { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .v5-frete-preco { font-size: 13px; font-weight: 700; color: #166534; }

        .v5-metodo-opcao { display: flex; align-items: center; gap: 10px; padding: 14px; border: 1.5px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; color: #111827; }
        .v5-metodo-ativo { background: #f9fafb; }

        .v5-cartao-box { border: 1.5px dashed #e5e7eb; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .v5-card-visual { width: 100%; max-width: 300px; height: 170px; margin: 0 auto 6px; position: relative; perspective: 1000px; }
        .v5-card-front, .v5-card-back { position: absolute; width: 100%; height: 100%; border-radius: 14px; padding: 18px; backface-visibility: hidden; transition: transform 0.6s; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .v5-card-front { color: white; }
        .v5-card-back { background: #1f2937; transform: rotateY(180deg); }
        .v5-card-visual.flipped .v5-card-front { transform: rotateY(-180deg); }
        .v5-card-visual.flipped .v5-card-back { transform: rotateY(0); }
        .v5-card-chip { width: 36px; height: 28px; background: linear-gradient(135deg, #d4af37, #f5d97d); border-radius: 5px; margin-bottom: 14px; }
        .v5-card-numero { font-size: 16px; letter-spacing: 2px; font-family: monospace; margin-bottom: 16px; }
        .v5-card-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
        .v5-card-label { font-size: 8px; opacity: 0.7; text-transform: uppercase; }
        .v5-card-value { font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .v5-card-tarja { height: 40px; background: #000; margin: -18px -18px 20px; }
        .v5-card-cvv-box { background: white; color: #333; padding: 6px 14px; border-radius: 4px; font-weight: 700; float: right; letter-spacing: 2px; }

        .v5-ob-embutido { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-top: 4px; display: flex; flex-direction: column; gap: 10px; }
        .v5-ob-selo { font-size: 12px; font-weight: 700; color: #374151; }
        .v5-ob-card { display: flex; gap: 12px; align-items: center; padding: 10px; background: white; border: 1.5px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: border-color 0.15s; }
        .v5-ob-card:hover { border-color: #9ca3af; }
        .v5-ob-card-ativo { background: #fafaff; }
        .v5-ob-checkbox { width: 18px; height: 18px; flex-shrink: 0; cursor: pointer; }
        .v5-ob-imagem { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .v5-ob-imagem-placeholder { width: 44px; height: 44px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .v5-ob-info { flex: 1; }
        .v5-ob-nome { font-size: 12px; font-weight: 700; color: #111827; }
        .v5-ob-desc { font-size: 11px; color: #6b7280; margin-top: 1px; }
        .v5-ob-preco { font-size: 13px; font-weight: 700; white-space: nowrap; }

        .v5-pix-box { border: 1.5px dashed #e5e7eb; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .v5-pix-texto { font-size: 13px; color: #374151; line-height: 1.5; }
        .v5-pix-valor { font-size: 18px; font-weight: 800; }

        .v5-btn-finalizar { padding: 16px; border: none; border-radius: 8px; color: white; font-weight: 800; font-size: 16px; cursor: pointer; margin-top: 6px; }
        .v5-btn-finalizar:disabled { opacity: 0.6; cursor: not-allowed; }

        .v5-resumo-box { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
        .v5-resumo-titulo { font-size: 15px; font-weight: 800; color: #111827; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6; margin-bottom: 12px; }
        .v5-resumo-linha { display: flex; justify-content: space-between; font-size: 13px; color: #374151; margin-bottom: 8px; }
        .v5-resumo-total { display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #111827; padding-top: 10px; border-top: 1px solid #f3f4f6; margin-bottom: 16px; }
        .v5-resumo-produto { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
        .v5-resumo-produto-img { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; }
        .v5-resumo-produto-img-placeholder { width: 40px; height: 40px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .v5-resumo-produto-info { flex: 1; }
        .v5-resumo-produto-nome { font-size: 12px; color: #2563eb; }
        .v5-resumo-produto-valor { font-size: 13px; font-weight: 700; color: #111827; }
        .v5-resumo-qtd { display: flex; align-items: center; gap: 14px; }
        .v5-qtd-btn { width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid #e5e7eb; background: white; font-size: 16px; font-weight: 700; cursor: pointer; }
        .v5-qtd-valor { font-weight: 700; font-size: 14px; }

        .v5-logo-bottom { text-align: center; padding: 10px 0; opacity: 0.6; }
        .v5-logo-bottom img { height: 36px; }

        @media (max-width: 1000px) {
          .v5-grid { grid-template-columns: 1fr 1fr; }
          .v5-col-resumo { grid-column: 1 / -1; position: static; }
        }
        .popup-prova-social { position: fixed; bottom: 20px; left: 20px; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); padding: 16px; max-width: 300px; z-index: 1000; animation: slideInV5 0.4s ease-out; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        @keyframes slideInV5 { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .popup-saindo { animation: slideOutV5 0.3s ease-out forwards !important; }
        @keyframes slideOutV5 { to { transform: translateX(-100%); opacity: 0; } }
        .popup-conteudo { display: flex; align-items: flex-start; gap: 12px; }
        .popup-avatar { width: 40px; height: 40px; background: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px; flex-shrink: 0; }
        .popup-texto { flex: 1; }
        .popup-linha { font-size: 13px; color: #111827; line-height: 1.4; margin: 0; }
        .popup-linha strong { font-weight: 700; }
        .popup-tempo { font-size: 12px; color: #9ca3af; margin: 4px 0 0; }
        @media (max-width: 640px) {
          .v5-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}