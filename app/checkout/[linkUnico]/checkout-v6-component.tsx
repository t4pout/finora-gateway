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

export default function CheckoutV6({ plano, formData, setFormData, etapa, setEtapa, processando, buscandoCep, tempoRestante, finalizarPedido, validarCPF, formatarTempo, orderBumpsSelecionados, setOrderBumpsSelecionados, quantidade, setQuantidade }: Props) {
  const cor = plano.checkoutCorPrimaria || '#8b5cf6';
  const [metodoPag, setMetodoPag] = useState(formData.metodoPagamento || 'CARTAO');
  const [cartaoData, setCartaoData] = useState({ numero: '', nome: '', validade: '', cvv: '', parcelas: '1' });
  const [flipCard, setFlipCard] = useState(false);
  const [resumoAberto, setResumoAberto] = useState(false);
  const [semEmail, setSemEmail] = useState(false);
  const handleSemEmail = (checked: boolean) => {
    setSemEmail(checked);
    if (checked) {
      const telLimpo = (formData.telefone || '').replace(/\D/g, '') || Date.now().toString();
      setFormData({ ...formData, email: `${telLimpo}@sememail.finora.com` });
    } else {
      setFormData({ ...formData, email: '' });
    }
  };

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
          if (ativos.length > 0) setFreteSelecionadoId(ativos[0].id);
        }
      } catch (e) { console.error('Erro ao carregar fretes:', e); }
      setCarregandoFretes(false);
    };
    carregarFretes();
  }, [plano?.produto?.id, precisaEndereco]);

  useEffect(() => {
    const cepLimpo = (formData.cep || '').replace(/\D/g, '');
    if (cepLimpo.length === 8 && formData.rua) setEnderecoExpandido(true);
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

  const condicao = plano.checkoutCondicaoDesconto;
  const economiaAtual = (plano.preco * quantidade) - valorProdutos;
  let mensagemCondicao: string | null = null;
  let listaFaixasExibir: any[] = [];
  if (condicao?.ativo) {
    if (condicao.tipo === 'PERCENTUAL_UNIDADE') {
      mensagemCondicao = quantidade > 1
        ? `🎉 Você está economizando R$ ${economiaAtual.toFixed(2).replace('.', ',')}!`
        : `🏷️ A partir da 2ª unidade, ganhe ${condicao.percentualUnidade}% de desconto em cada adicional!`;
    } else if (condicao.tipo === 'VALOR_FIXO_UNIDADE') {
      mensagemCondicao = quantidade > 1
        ? `🎉 Você está economizando R$ ${economiaAtual.toFixed(2).replace('.', ',')}!`
        : `🏷️ A partir da 2ª unidade, pague só R$ ${Number(condicao.valorFixoUnidade).toFixed(2).replace('.', ',')} em cada adicional!`;
    } else if (condicao.tipo === 'LOTE_FAIXAS' && Array.isArray(condicao.faixas) && condicao.faixas.length > 0) {
      const faixasOrdenadas = [...condicao.faixas].sort((a, b) => Number(a.quantidadeMinima) - Number(b.quantidadeMinima));
      const faixaAtingida = [...faixasOrdenadas].reverse().find(f => quantidade >= Number(f.quantidadeMinima));
      const listaFaixas = faixasOrdenadas.map(f => ({ ...f, atingida: quantidade >= Number(f.quantidadeMinima) }));
      listaFaixasExibir = listaFaixas;
      const proximaFaixa = faixasOrdenadas.find(f => quantidade < Number(f.quantidadeMinima));
      if (faixaAtingida) {
        mensagemCondicao = `🎉 Desconto de ${faixaAtingida.percentual}% desbloqueado! Você economiza R$ ${economiaAtual.toFixed(2).replace('.', ',')}!`;
      } else if (proximaFaixa) {
        const faltam = Number(proximaFaixa.quantidadeMinima) - quantidade;
        mensagemCondicao = `🔒 Faltam ${faltam} unidade${faltam > 1 ? 's' : ''} para destravar ${proximaFaixa.percentual}% de desconto!`;
      }
    }
  }

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
    const dadosFinais = {
      metodoPagamento: metodoPag,
      cartaoNumero: cartaoData.numero.replace(/\D/g, ''),
      cartaoNome: cartaoData.nome,
      cartaoMes: cartaoData.validade.split('/')[0] || '',
      cartaoAno: cartaoData.validade.split('/')[1] || '',
      cartaoCvv: cartaoData.cvv,
      parcelas: cartaoData.parcelas
    };
    setFormData((prev: any) => ({ ...prev, ...dadosFinais }));
    (finalizarPedido as any)(dadosFinais);
  };

  const orderBumpBlock = plano.orderBumps && plano.orderBumps.length > 0 && (
    <div className="v6-ob-embutido">
      <div className="v6-ob-selo">Oferta{plano.orderBumps.length > 1 ? 's' : ''} especial{plano.orderBumps.length > 1 ? 'is' : ''} pra você</div>
      {plano.orderBumps.map((ob) => {
        const selecionado = orderBumpsSelecionados.includes(ob.orderBump.id);
        return (
          <label key={ob.orderBump.id} className={`v6-ob-card ${selecionado ? 'v6-ob-card-ativo' : ''}`} style={selecionado ? { borderColor: cor } : {}}>
            <input type="checkbox" checked={selecionado} className="v6-ob-checkbox" onChange={(e) => {
              if (e.target.checked) setOrderBumpsSelecionados([...orderBumpsSelecionados, ob.orderBump.id]);
              else setOrderBumpsSelecionados(orderBumpsSelecionados.filter(id => id !== ob.orderBump.id));
            }} />
            {ob.orderBump.imagem ? (
              <img src={ob.orderBump.imagem} alt={ob.orderBump.titulo} className="v6-ob-imagem" />
            ) : (
              <div className="v6-ob-imagem-placeholder">📦</div>
            )}
            <div className="v6-ob-info">
              <div className="v6-ob-nome">{ob.orderBump.titulo}</div>
              {ob.orderBump.descricao && <div className="v6-ob-desc">{ob.orderBump.descricao}</div>}
            </div>
            <div className="v6-ob-preco" style={{ color: cor }}>+ R$ {ob.orderBump.preco.toFixed(2).replace('.', ',')}</div>
          </label>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="v6-page">
        {plano.checkoutLogoSuperior && (
          <div className="v6-logo-top"><img src={plano.checkoutLogoSuperior} alt="Logo" /></div>
        )}
        {plano.checkoutBanner && (
          <div className="v6-banner"><img src={plano.checkoutBanner} alt="Banner" /></div>
        )}

        {plano.checkoutCronometro && tempoRestante > 0 && (
          <div className="v6-faixa">
            <div className="v6-faixa-topo">{plano.checkoutMensagemUrgencia ? '' : 'ENVIO IMEDIATO, COM RASTREIO E NOTA FISCAL!'}</div>
            <div className="v6-faixa-baixo">⏱️ {plano.checkoutMensagemUrgencia || 'Oferta termina em'} <strong>{formatarTempo(tempoRestante)}</strong></div>
          </div>
        )}

        {/* BARRA DE RESUMO COMPACTA */}
        {etapa !== etapaPagamento && (
        <div className="v6-resumo-compacto-wrap">
          <button type="button" className="v6-resumo-compacto" onClick={() => setResumoAberto(!resumoAberto)}>
            <span>🛒 {quantidade}x {plano.produto?.nome} · Total R$ {totalGeral.toFixed(2).replace('.', ',')}</span>
            <span className="v6-resumo-seta">{resumoAberto ? '▲' : '▼'}</span>
          </button>
          {resumoAberto && (
            <div className="v6-resumo-expandido">
              {plano.produto && (
                <div className="v6-resumo-produto">
                  {plano.produto.imagem ? <img src={plano.produto.imagem} alt={plano.produto.nome} className="v6-resumo-produto-img" /> : <div className="v6-resumo-produto-img-placeholder">📦</div>}
                  <div className="v6-resumo-produto-info">
                    <div className="v6-resumo-produto-nome">{plano.produto.nome}</div>
                    <div className="v6-resumo-produto-valor">R$ {valorProdutos.toFixed(2).replace('.', ',')}</div>
                  </div>
                  <div className="v6-resumo-qtd">
                    <button type="button" onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="v6-qtd-btn">−</button>
                    <span className="v6-qtd-valor">{quantidade}</span>
                    <button type="button" onClick={() => setQuantidade(quantidade + 1)} className="v6-qtd-btn">+</button>
                  </div>
                </div>
              )}
              <p className="v6-dica-qtd">Toque em − ou + para ajustar quantas unidades você deseja levar</p>
              {mensagemCondicao && (
                <div className="v6-condicao-selo" style={economiaAtual > 0 ? { background: '#f0fdf4', borderColor: '#86efac', color: '#166534' } : { background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
                  {mensagemCondicao}
                </div>
              )}
              {listaFaixasExibir.length > 0 && (
                <div className="v6-faixas-lista">
                  {listaFaixasExibir.map((f: any, i: number) => (
                    <div key={i} className={`v6-faixa-item ${f.atingida ? 'v6-faixa-atingida' : ''}`}>
                      <span>{f.atingida ? '✅' : '🔒'} A partir de {f.quantidadeMinima} unidades</span>
                      <span className="v6-faixa-percentual">{f.percentual}% OFF</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="v6-resumo-linha"><span>Produtos ({quantidade})</span><span>R$ {valorProdutos.toFixed(2).replace('.', ',')}</span></div>
              {orderBumpsValor > 0 && <div className="v6-resumo-linha"><span>Adicionais</span><span>R$ {orderBumpsValor.toFixed(2).replace('.', ',')}</span></div>}
              {precisaEndereco && <div className="v6-resumo-linha"><span>Frete</span><span>{freteValorAtual > 0 ? `R$ ${freteValorAtual.toFixed(2).replace('.', ',')}` : 'Grátis'}</span></div>}
              <div className="v6-resumo-total"><span>Total</span><span>R$ {totalGeral.toFixed(2).replace('.', ',')}</span></div>
            </div>
          )}
        </div>
        )}

        <div className="v6-card">
          <div className="v6-progress">
            {Array.from({ length: totalEtapas }).map((_, i) => {
              const n = i + 1;
              const rotulo = totalEtapas === 3 ? ['Dados', 'Entrega', 'Pagamento'][i] : ['Dados', 'Pagamento'][i];
              return (
                <div key={n} style={{ display: 'contents' }}>
                  <div className={etapa >= n ? 'v6-step active' : 'v6-step'}>
                    <div className="v6-step-circle" style={etapa >= n ? { background: cor, borderColor: cor } : {}}>{etapa > n ? '✓' : n}</div>
                    <span className="v6-step-label">{rotulo}</span>
                  </div>
                  {n < totalEtapas && <div className={etapa > n ? 'v6-step-line active' : 'v6-step-line'} style={etapa > n ? { background: cor } : {}}></div>}
                </div>
              );
            })}
          </div>

          <div className="v6-conteudo">
            {etapa === 1 && (
              <div className="v6-form v6-fade-in">
                <p className="v6-instrucao">Preencha seus dados para continuarmos com o seu pedido:</p>
                <div className="v6-campo">
                  <label className="v6-label">Seu nome completo</label>
                  <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} placeholder="Escreva seu nome completo" className="v6-input" />
                </div>
                <div className="v6-campo">
                  <label className="v6-label">Seu e-mail</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Escreva seu e-mail" className="v6-input" disabled={semEmail} />
                  <span className="v6-dica">Enviaremos a confirmação do seu pedido nesse e-mail</span>
                  <label className="v6-checkbox-linha">
                    <input type="checkbox" checked={semEmail} onChange={(e) => handleSemEmail(e.target.checked)} />
                    <span>Não tenho e-mail</span>
                  </label>
                </div>
                <div className="v6-campo">
                  <label className="v6-label">Seu CPF</label>
                  <input type="text" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: formatarCPF(e.target.value)})} placeholder="Escreva seu CPF" className="v6-input" maxLength={14} />
                </div>
                <div className="v6-campo">
                  <label className="v6-label">Seu telefone</label>
                  <input type="tel" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} placeholder="Escreva seu número de telefone" className="v6-input" />
                </div>
                <button onClick={avancarEtapa1} className="v6-btn-continuar" style={{ background: cor }}>Continuar</button>
                <p className="v6-termos">Ao prosseguir com a compra, você concorda com as <a href="#">Políticas de Privacidade</a></p>
              </div>
            )}

            {etapa === 2 && precisaEndereco && (
              <div className="v6-form v6-fade-in">
                <p className="v6-instrucao">Digite o CEP para encontrarmos seu endereço automaticamente:</p>
                <div className="v6-campo">
                  <label className="v6-label">Seu CEP</label>
                  <div className="v6-row">
                    <input type="text" value={formData.cep} onChange={(e) => setFormData({...formData, cep: e.target.value})} placeholder="Escreva seu CEP" className="v6-input" maxLength={9} />
                    {buscandoCep && <span className="v6-loading-cep">Buscando...</span>}
                  </div>
                </div>
                {enderecoExpandido && (
                  <>
                    <div className="v6-campo">
                      <label className="v6-label">Seu endereço</label>
                      <input type="text" value={formData.rua} onChange={(e) => setFormData({...formData, rua: e.target.value})} placeholder="Rua, avenida..." className="v6-input" />
                    </div>
                    <div className="v6-row">
                      <div className="v6-campo" style={{maxWidth: '130px'}}>
                        <label className="v6-label">Número</label>
                        <input type="text" value={formData.numero} onChange={(e) => setFormData({...formData, numero: e.target.value})} placeholder="Nº" className="v6-input" />
                      </div>
                      <div className="v6-campo">
                        <label className="v6-label">Bairro</label>
                        <input type="text" value={formData.bairro} onChange={(e) => setFormData({...formData, bairro: e.target.value})} placeholder="Seu bairro" className="v6-input" />
                      </div>
                    </div>
                    <div className="v6-campo">
                      <label className="v6-label">Complemento (opcional)</label>
                      <input type="text" value={formData.complemento} onChange={(e) => setFormData({...formData, complemento: e.target.value})} placeholder="Apto, bloco, casa..." className="v6-input" />
                    </div>

                    {carregandoFretes ? (
                      <p className="v6-aviso">Calculando opções de frete...</p>
                    ) : fretes.length > 0 ? (
                      <div className="v6-fretes">
                        <p className="v6-fretes-titulo">Escolha como prefere receber seu pedido:</p>
                        {fretes.map((f) => (
                          <label key={f.id} className={`v6-frete-opcao ${freteSelecionadoId === f.id ? 'v6-frete-ativo' : ''}`} style={freteSelecionadoId === f.id ? { borderColor: cor } : {}}>
                            <input type="radio" checked={freteSelecionadoId === f.id} onChange={() => selecionarFrete(f)} />
                            <div className="v6-frete-info">
                              <div className="v6-frete-nome">{f.nome.toUpperCase()} — {f.prazoDias} DIAS</div>
                              {f.descricao && <div className="v6-frete-desc">{f.descricao}</div>}
                            </div>
                            <div className="v6-frete-preco">{f.preco > 0 ? `R$ ${f.preco.toFixed(2).replace('.', ',')}` : 'Grátis'}</div>
                          </label>
                        ))}
                      </div>
                    ) : null}

                    <div className="v6-btn-row">
                      <button onClick={() => setEtapa(1)} className="v6-btn-voltar">Voltar</button>
                      <button onClick={avancarEtapa2} className="v6-btn-continuar" style={{ background: cor }}>Continuar</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {etapa === etapaPagamento && (
              <div className="v6-form v6-fade-in">
                <p className="v6-instrucao">Selecione uma forma de pagamento:</p>
                {plano.checkoutAceitaCartao && (
                  <label className={`v6-metodo-opcao ${metodoPag === 'CARTAO' ? 'v6-metodo-ativo' : ''}`} style={metodoPag === 'CARTAO' ? { borderColor: cor } : {}}>
                    <input type="radio" checked={metodoPag === 'CARTAO'} onChange={() => setMetodoPag('CARTAO')} />
                    <span>💳 Cartão de crédito</span>
                  </label>
                )}
                {plano.checkoutAceitaPix && (
                  <label className={`v6-metodo-opcao ${metodoPag === 'PIX' ? 'v6-metodo-ativo' : ''}`} style={metodoPag === 'PIX' ? { borderColor: cor } : {}}>
                    <input type="radio" checked={metodoPag === 'PIX'} onChange={() => setMetodoPag('PIX')} />
                    <span>◈ Pix</span>
                  </label>
                )}
                {plano.checkoutAceitaBoleto && (
                  <label className={`v6-metodo-opcao ${metodoPag === 'BOLETO' ? 'v6-metodo-ativo' : ''}`} style={metodoPag === 'BOLETO' ? { borderColor: cor } : {}}>
                    <input type="radio" checked={metodoPag === 'BOLETO'} onChange={() => setMetodoPag('BOLETO')} />
                    <span>📄 Boleto bancário</span>
                  </label>
                )}

                {metodoPag === 'CARTAO' && plano.checkoutAceitaCartao && (
                  <div className="v6-cartao-box">
                    <p className="v6-instrucao-menor">Preencha os dados do seu cartão:</p>
                    <div className={`v6-card-visual ${flipCard ? 'flipped' : ''}`}>
                      <div className="v6-card-front" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}99)` }}>
                        <div className="v6-card-chip"></div>
                        <div className="v6-card-numero">{cartaoData.numero || '•••• •••• •••• ••••'}</div>
                        <div className="v6-card-bottom">
                          <div><div className="v6-card-label">TITULAR</div><div className="v6-card-value">{cartaoData.nome || 'NOME E SOBRENOME'}</div></div>
                          <div><div className="v6-card-label">VAL.</div><div className="v6-card-value">{cartaoData.validade || 'MM/AA'}</div></div>
                        </div>
                      </div>
                      <div className="v6-card-back">
                        <div className="v6-card-tarja"></div>
                        <div className="v6-card-cvv-box">{cartaoData.cvv || '•••'}</div>
                      </div>
                    </div>
                    <div className="v6-campo">
                      <label className="v6-label">Número do cartão</label>
                      <input type="text" value={cartaoData.numero} onChange={(e) => setCartaoData({...cartaoData, numero: formatarNumeroCartao(e.target.value)})} placeholder="Escreva o número do cartão" className="v6-input" maxLength={19} />
                    </div>
                    <div className="v6-row">
                      <div className="v6-campo">
                        <label className="v6-label">Validade</label>
                        <input type="text" value={cartaoData.validade} onChange={(e) => setCartaoData({...cartaoData, validade: formatarValidade(e.target.value)})} placeholder="MM/AA" className="v6-input" maxLength={5} />
                      </div>
                      <div className="v6-campo">
                        <label className="v6-label">Código de segurança</label>
                        <input type="text" value={cartaoData.cvv} onFocus={() => setFlipCard(true)} onBlur={() => setFlipCard(false)} onChange={(e) => setCartaoData({...cartaoData, cvv: e.target.value.replace(/\D/g,'').slice(0,4)})} placeholder="CVV" className="v6-input" maxLength={4} />
                      </div>
                    </div>
                    <div className="v6-campo">
                      <label className="v6-label">Nome no cartão</label>
                      <input type="text" value={cartaoData.nome} onChange={(e) => setCartaoData({...cartaoData, nome: e.target.value.toUpperCase()})} placeholder="Nome como está no cartão" className="v6-input" />
                    </div>
                    <div className="v6-campo">
                      <label className="v6-label">Parcelas</label>
                      <select value={cartaoData.parcelas} onChange={(e) => setCartaoData({...cartaoData, parcelas: e.target.value})} className="v6-input">
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                          <option key={n} value={n}>{n}x de R$ {(totalGeral / n).toFixed(2).replace('.', ',')}{n === 1 ? ' sem juros' : ''}</option>
                        ))}
                      </select>
                    </div>
                    {orderBumpBlock}
                  </div>
                )}

                {metodoPag === 'PIX' && plano.checkoutAceitaPix && (
                  <div className="v6-metodo-box">
                    <p className="v6-metodo-texto">A confirmação de pagamento é realizada em poucos minutos. Utilize o aplicativo do seu banco para pagar.</p>
                    <div className="v6-metodo-valor" style={{ color: cor }}>Valor no Pix: R$ {totalGeral.toFixed(2).replace('.', ',')}</div>
                    {orderBumpBlock}
                  </div>
                )}

                {metodoPag === 'BOLETO' && plano.checkoutAceitaBoleto && (
                  <div className="v6-metodo-box">
                    <p className="v6-metodo-texto">O boleto vence em <strong>3 dias úteis</strong>. A confirmação do pagamento pode levar até 3 dias úteis após o pagamento. O boleto será enviado para o seu e-mail.</p>
                    <div className="v6-metodo-valor" style={{ color: cor }}>Valor no Boleto: R$ {totalGeral.toFixed(2).replace('.', ',')}</div>
                    {orderBumpBlock}
                  </div>
                )}

                <div className="v6-resumo-final">
                  <p className="v6-resumo-final-titulo">Resumo da sua compra</p>
                  {plano.produto && (
                    <div className="v6-resumo-produto">
                      {plano.produto.imagem ? <img src={plano.produto.imagem} alt={plano.produto.nome} className="v6-resumo-produto-img" /> : <div className="v6-resumo-produto-img-placeholder">📦</div>}
                      <div className="v6-resumo-produto-info">
                        <div className="v6-resumo-produto-nome">{plano.produto.nome}</div>
                        <div className="v6-resumo-produto-valor">R$ {valorProdutos.toFixed(2).replace('.', ',')}</div>
                      </div>
                      <div className="v6-resumo-qtd">
                        <button type="button" onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="v6-qtd-btn">−</button>
                        <span className="v6-qtd-valor">{quantidade}</span>
                        <button type="button" onClick={() => setQuantidade(quantidade + 1)} className="v6-qtd-btn">+</button>
                      </div>
                    </div>
                  )}
                  <p className="v6-dica-qtd">Toque em − ou + para ajustar quantas unidades você deseja levar</p>
                  {mensagemCondicao && (
                    <div className="v6-condicao-selo" style={economiaAtual > 0 ? { background: '#f0fdf4', borderColor: '#86efac', color: '#166534' } : { background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
                      {mensagemCondicao}
                    </div>
                  )}
                  <div className="v6-resumo-linha"><span>Produtos ({quantidade})</span><span>R$ {valorProdutos.toFixed(2).replace('.', ',')}</span></div>
                  {orderBumpsValor > 0 && <div className="v6-resumo-linha"><span>Adicionais</span><span>R$ {orderBumpsValor.toFixed(2).replace('.', ',')}</span></div>}
                  {precisaEndereco && <div className="v6-resumo-linha"><span>Frete</span><span>{freteValorAtual > 0 ? `R$ ${freteValorAtual.toFixed(2).replace('.', ',')}` : 'Grátis'}</span></div>}
                  <div className="v6-resumo-total"><span>Total</span><span>R$ {totalGeral.toFixed(2).replace('.', ',')}</span></div>
                </div>

                <div className="v6-btn-row">
                  <button onClick={() => setEtapa(precisaEndereco ? 2 : 1)} className="v6-btn-voltar">Voltar</button>
                  <button onClick={handleFinalizar} disabled={processando} className="v6-btn-finalizar" style={{ background: processando ? '#9ca3af' : '#16a34a' }}>
                    {processando ? 'Processando...' : 'Finalizar compra'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {plano.checkoutLogoInferior && (
          <div className="v6-logo-bottom"><img src={plano.checkoutLogoInferior} alt="Logo" /></div>
        )}
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .v6-page { min-height: 100vh; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding-bottom: 20px; }
        .v6-logo-top { text-align: center; padding: 20px 0; background: white; }
        .v6-logo-top img { height: 44px; }
        .v6-banner { max-width: 560px; margin: 0 auto; padding: 0 16px 16px; }
        .v6-banner img { width: 100%; border-radius: 10px; display: block; }
        .v6-faixa { background: #0c1b3a; color: white; text-align: center; padding: 14px; }
        .v6-faixa-topo { font-weight: 800; font-size: 13px; }
        .v6-faixa-baixo { font-size: 13px; margin-top: 4px; }
        .v6-faixa-baixo strong { color: #facc15; font-size: 15px; }

        .v6-resumo-compacto-wrap { max-width: 560px; margin: 16px auto 0; padding: 0 16px; position: sticky; top: 8px; z-index: 100; }
        .v6-resumo-compacto { width: 100%; display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #111827; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
        .v6-resumo-seta { font-size: 10px; color: #9ca3af; }
        .v6-resumo-expandido { background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; padding: 14px 16px; margin-top: -1px; box-shadow: 0 4px 10px rgba(0,0,0,0.06); }
        .v6-resumo-produto { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .v6-resumo-produto-img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
        .v6-resumo-produto-img-placeholder { width: 44px; height: 44px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .v6-resumo-produto-info { flex: 1; }
        .v6-resumo-produto-nome { font-size: 13px; font-weight: 700; color: #111827; }
        .v6-resumo-produto-valor { font-size: 12px; color: #6b7280; }
        .v6-resumo-qtd { display: flex; align-items: center; gap: 10px; }
        .v6-qtd-btn { width: 28px; height: 28px; border-radius: 6px; border: 1.5px solid #e5e7eb; background: white; font-size: 14px; font-weight: 700; cursor: pointer; }
        .v6-qtd-valor { font-weight: 700; font-size: 13px; }
        .v6-dica-qtd { font-size: 11px; color: #9ca3af; margin-bottom: 10px; }
        .v6-condicao-selo { padding: 8px 10px; border: 1.5px solid; border-radius: 8px; font-size: 11px; font-weight: 700; text-align: center; margin-bottom: 10px; }
        .v6-faixas-lista { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        .v6-faixa-item { display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; background: #f9fafb; color: #9ca3af; border: 1px solid #e5e7eb; }
        .v6-faixa-atingida { background: #f0fdf4; color: #166534; border-color: #86efac; }
        .v6-faixa-percentual { font-weight: 800; }
        .v6-resumo-linha { display: flex; justify-content: space-between; font-size: 12px; color: #374151; margin-bottom: 6px; }
        .v6-resumo-total { display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; color: #111827; padding-top: 8px; border-top: 1px solid #f3f4f6; }
        .v6-resumo-final { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-top: 4px; }
        .v6-resumo-final-titulo { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 10px; }
        .v6-card { max-width: 560px; margin: 16px auto 0; background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; }
        .v6-progress { display: flex; align-items: center; justify-content: center; padding: 24px 16px 20px; }
        .v6-step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .v6-step-circle { width: 34px; height: 34px; border-radius: 50%; background: #e5e7eb; border: 2px solid #e5e7eb; color: #9ca3af; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; transition: all 0.3s; }
        .v6-step.active .v6-step-circle { color: white; }
        .v6-step-label { font-size: 11px; color: #9ca3af; font-weight: 600; }
        .v6-step.active .v6-step-label { color: #111827; }
        .v6-step-line { width: 40px; height: 2px; background: #e5e7eb; margin: 0 4px 18px; }
        .v6-step-line.active { background: #16a34a; }

        .v6-conteudo { padding: 8px 24px 28px; }
        .v6-form { display: flex; flex-direction: column; gap: 12px; }
        .v6-fade-in { animation: v6FadeIn 0.3s ease-in; }
        @keyframes v6FadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .v6-instrucao { font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 2px; }
        .v6-instrucao-menor { font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: -2px; }
        .v6-campo { display: flex; flex-direction: column; gap: 5px; flex: 1; }
        .v6-label { font-size: 12px; font-weight: 700; color: #374151; }
        .v6-dica { font-size: 11px; color: #9ca3af; }
        .v6-checkbox-linha { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7280; font-weight: 500; cursor: pointer; margin-top: 2px; }
        .v6-checkbox-linha input { width: 16px; height: 16px; cursor: pointer; }
        .v6-row { display: flex; gap: 10px; align-items: flex-start; }
        .v6-input { padding: 13px 15px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 15px; outline: none; width: 100%; }
        .v6-input:focus { border-color: #9ca3af; }
        .v6-loading-cep { font-size: 12px; color: #6b7280; white-space: nowrap; align-self: center; }
        .v6-btn-continuar { padding: 15px; border: none; border-radius: 10px; color: white; font-weight: 700; font-size: 16px; cursor: pointer; margin-top: 4px; }
        .v6-termos { font-size: 11px; color: #9ca3af; text-align: center; }
        .v6-termos a { color: #6b7280; text-decoration: underline; }
        .v6-aviso { font-size: 13px; color: #9ca3af; }

        .v6-fretes { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
        .v6-fretes-titulo { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px; }
        .v6-frete-opcao { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1.5px solid #e5e7eb; border-radius: 10px; cursor: pointer; }
        .v6-frete-ativo { background: #f9fafb; }
        .v6-frete-info { flex: 1; }
        .v6-frete-nome { font-size: 12px; font-weight: 800; color: #111827; }
        .v6-frete-desc { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .v6-frete-preco { font-size: 13px; font-weight: 700; color: #166534; }

        .v6-metodo-opcao { display: flex; align-items: center; gap: 10px; padding: 15px; border: 1.5px solid #e5e7eb; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 14px; color: #111827; }
        .v6-metodo-ativo { background: #f9fafb; }

        .v6-cartao-box, .v6-metodo-box { border: 1.5px dashed #e5e7eb; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .v6-card-visual { width: 100%; max-width: 300px; height: 170px; margin: 0 auto 6px; position: relative; perspective: 1000px; }
        .v6-card-front, .v6-card-back { position: absolute; width: 100%; height: 100%; border-radius: 14px; padding: 18px; backface-visibility: hidden; transition: transform 0.6s; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .v6-card-front { color: white; }
        .v6-card-back { background: #1f2937; transform: rotateY(180deg); }
        .v6-card-visual.flipped .v6-card-front { transform: rotateY(-180deg); }
        .v6-card-visual.flipped .v6-card-back { transform: rotateY(0); }
        .v6-card-chip { width: 36px; height: 28px; background: linear-gradient(135deg, #d4af37, #f5d97d); border-radius: 5px; margin-bottom: 14px; }
        .v6-card-numero { font-size: 16px; letter-spacing: 2px; font-family: monospace; margin-bottom: 16px; }
        .v6-card-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
        .v6-card-label { font-size: 8px; opacity: 0.7; text-transform: uppercase; }
        .v6-card-value { font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .v6-card-tarja { height: 40px; background: #000; margin: -18px -18px 20px; }
        .v6-card-cvv-box { background: white; color: #333; padding: 6px 14px; border-radius: 4px; font-weight: 700; float: right; letter-spacing: 2px; }

        .v6-metodo-texto { font-size: 13px; color: #374151; line-height: 1.5; }
        .v6-metodo-valor { font-size: 18px; font-weight: 800; }

        .v6-ob-embutido { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-top: 4px; display: flex; flex-direction: column; gap: 10px; }
        .v6-ob-selo { font-size: 12px; font-weight: 700; color: #374151; }
        .v6-ob-card { display: flex; gap: 12px; align-items: center; padding: 10px; background: white; border: 1.5px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: border-color 0.15s; }
        .v6-ob-card:hover { border-color: #9ca3af; }
        .v6-ob-card-ativo { background: #fafaff; }
        .v6-ob-checkbox { width: 18px; height: 18px; flex-shrink: 0; cursor: pointer; }
        .v6-ob-imagem { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .v6-ob-imagem-placeholder { width: 44px; height: 44px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .v6-ob-info { flex: 1; }
        .v6-ob-nome { font-size: 12px; font-weight: 700; color: #111827; }
        .v6-ob-desc { font-size: 11px; color: #6b7280; margin-top: 1px; }
        .v6-ob-preco { font-size: 13px; font-weight: 700; white-space: nowrap; }

        .v6-btn-row { display: flex; gap: 10px; margin-top: 4px; }
        .v6-btn-voltar { padding: 15px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 15px; font-weight: 600; color: #6b7280; background: white; cursor: pointer; }
        .v6-btn-finalizar { flex: 1; padding: 16px; border: none; border-radius: 10px; color: white; font-weight: 800; font-size: 16px; cursor: pointer; }
        .v6-btn-finalizar:disabled { opacity: 0.6; cursor: not-allowed; }

        .v6-logo-bottom { text-align: center; padding: 20px 0 0; opacity: 0.6; }
        .v6-logo-bottom img { height: 36px; }

        @media (max-width: 640px) {
          .v6-card { border-radius: 12px; margin-left: 12px; margin-right: 12px; }
          .v6-resumo-compacto-wrap { padding: 0 12px; }
          .v6-conteudo { padding: 8px 18px 22px; }
        }
      `}</style>
    </>
  );
}