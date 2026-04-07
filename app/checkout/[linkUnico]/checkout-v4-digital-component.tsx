'use client';
import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Star, Check } from 'lucide-react';

interface CheckoutV4Props {
  plano: any;
  formData: any;
  setFormData: (data: any) => void;
  processando: boolean;
  finalizarPedido: () => void;
  validarCPF: (cpf: string) => boolean;
  orderBumpsSelecionados: string[];
  setOrderBumpsSelecionados: (ids: string[]) => void;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export default function CheckoutV4DigitalComponent({
  plano, formData, setFormData, processando,
  finalizarPedido, validarCPF, orderBumpsSelecionados, setOrderBumpsSelecionados
}: CheckoutV4Props) {
  const [metodoPag, setMetodoPag] = useState(formData.metodoPagamento || 'PIX');
  const [erros, setErros] = useState<any>({});
  const [cartaoData, setCartaoData] = useState({ numero: '', nome: '', mes: '', ano: '', cvv: '', parcelas: '1' });

  const corPrimaria = plano.checkoutCorPrimaria || '#7c3aed';

  const totalComBumps = plano.preco + (plano.orderBumps
    ? plano.orderBumps.filter((ob: any) => orderBumpsSelecionados.includes(ob.orderBump.id)).reduce((acc: number, ob: any) => acc + ob.orderBump.preco, 0)
    : 0);

  const validar = () => {
    const e: any = {};
    if (!formData.nome) e.nome = 'Obrigatório';
    if (!formData.email) e.email = 'Obrigatório';
    if (!formData.telefone) e.telefone = 'Obrigatório';
    if (!formData.cpf || !validarCPF(formData.cpf)) e.cpf = 'CPF inválido';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleFinalizar = () => {
    if (!validar()) return;
    setFormData({ ...formData, metodoPagamento: metodoPag });
    finalizarPedido();
  };

  useEffect(() => {
    setFormData({ ...formData, metodoPagamento: metodoPag });
  }, [metodoPag]);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f8f8f6', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e5e5', padding: '16px 0' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {plano.checkoutLogoSuperior
            ? <img src={plano.checkoutLogoSuperior} alt="Logo" style={{ height: '36px' }} />
            : <div style={{ fontSize: '20px', fontWeight: '700', color: '#111' }}>{plano.produto?.nome || 'Checkout'}</div>
          }
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666' }}>
            <Lock size={14} />
            <span>Compra segura</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* Banner */}
        {plano.checkoutBanner && (
          <img src={plano.checkoutBanner} alt="Banner" style={{ width: '100%', borderRadius: '12px', marginBottom: '20px' }} />
        )}

        {/* Produto */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid #e5e5e5' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {plano.produto?.imagem && (
              <img src={plano.produto.imagem} alt={plano.produto.nome} style={{ width: '72px', height: '72px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111', marginBottom: '4px' }}>{plano.nome}</div>
              {plano.descricao && <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.4' }}>{plano.descricao}</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: corPrimaria }}>R$ {totalComBumps.toFixed(2).replace('.', ',')}</div>
            </div>
          </div>
        </div>

        {/* Order Bumps */}
        {plano.orderBumps && plano.orderBumps.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Adicione ao pedido</div>
            {plano.orderBumps.map((ob: any) => (
              <label key={ob.orderBump.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', border: orderBumpsSelecionados.includes(ob.orderBump.id) ? `2px solid ${corPrimaria}` : '2px solid #e5e5e5', borderRadius: '12px', padding: '14px', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: orderBumpsSelecionados.includes(ob.orderBump.id) ? `2px solid ${corPrimaria}` : '2px solid #ccc', background: orderBumpsSelecionados.includes(ob.orderBump.id) ? corPrimaria : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {orderBumpsSelecionados.includes(ob.orderBump.id) && <Check size={12} color="white" />}
                  <input type="checkbox" checked={orderBumpsSelecionados.includes(ob.orderBump.id)} onChange={(e) => { if (e.target.checked) setOrderBumpsSelecionados([...orderBumpsSelecionados, ob.orderBump.id]); else setOrderBumpsSelecionados(orderBumpsSelecionados.filter(id => id !== ob.orderBump.id)); }} style={{ display: 'none' }} />
                </div>
                {ob.orderBump.imagem && <img src={ob.orderBump.imagem} alt={ob.orderBump.titulo} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>{ob.orderBump.titulo}</div>
                  {ob.orderBump.descricao && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{ob.orderBump.descricao}</div>}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: corPrimaria, flexShrink: 0 }}>+ R$ {ob.orderBump.preco.toFixed(2).replace('.', ',')}</div>
              </label>
            ))}
          </div>
        )}

        {/* Formulário — SEM endereço */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', border: '1px solid #e5e5e5' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '16px' }}>Seus dados</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <input type="text" placeholder="Nome completo" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                style={{ width: '100%', padding: '13px 16px', border: erros.nome ? '2px solid #ef4444' : '2px solid #e5e5e5', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = corPrimaria} onBlur={(e) => e.target.style.borderColor = erros.nome ? '#ef4444' : '#e5e5e5'} />
              {erros.nome && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{erros.nome}</div>}
            </div>
            <div>
              <input type="email" placeholder="E-mail" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '13px 16px', border: erros.email ? '2px solid #ef4444' : '2px solid #e5e5e5', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = corPrimaria} onBlur={(e) => e.target.style.borderColor = erros.email ? '#ef4444' : '#e5e5e5'} />
              {erros.email && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{erros.email}</div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <input type="tel" placeholder="Telefone" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  style={{ width: '100%', padding: '13px 16px', border: erros.telefone ? '2px solid #ef4444' : '2px solid #e5e5e5', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = corPrimaria} onBlur={(e) => e.target.style.borderColor = erros.telefone ? '#ef4444' : '#e5e5e5'} />
                {erros.telefone && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{erros.telefone}</div>}
              </div>
              <div>
                <input type="text" placeholder="CPF" value={formData.cpf} onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
                  else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
                  setFormData({ ...formData, cpf: v });
                }} maxLength={14}
                  style={{ width: '100%', padding: '13px 16px', border: erros.cpf ? '2px solid #ef4444' : '2px solid #e5e5e5', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = corPrimaria} onBlur={(e) => e.target.style.borderColor = erros.cpf ? '#ef4444' : '#e5e5e5'} />
                {erros.cpf && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{erros.cpf}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Pagamento */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', border: '1px solid #e5e5e5' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '16px' }}>Pagamento</div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {plano.checkoutAceitaPix && (
              <button type="button" onClick={() => setMetodoPag('PIX')}
                style={{ flex: 1, padding: '12px', border: metodoPag === 'PIX' ? `2px solid ${corPrimaria}` : '2px solid #e5e5e5', borderRadius: '10px', background: metodoPag === 'PIX' ? corPrimaria + '10' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: metodoPag === 'PIX' ? corPrimaria : '#666', transition: 'all 0.2s' }}>
                PIX
              </button>
            )}
            {plano.checkoutAceitaCartao && (
              <button type="button" onClick={() => setMetodoPag('CARTAO')}
                style={{ flex: 1, padding: '12px', border: metodoPag === 'CARTAO' ? `2px solid ${corPrimaria}` : '2px solid #e5e5e5', borderRadius: '10px', background: metodoPag === 'CARTAO' ? corPrimaria + '10' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: metodoPag === 'CARTAO' ? corPrimaria : '#666', transition: 'all 0.2s' }}>
                Cartão
              </button>
            )}
            {plano.checkoutAceitaBoleto && (
              <button type="button" onClick={() => setMetodoPag('BOLETO')}
                style={{ flex: 1, padding: '12px', border: metodoPag === 'BOLETO' ? `2px solid ${corPrimaria}` : '2px solid #e5e5e5', borderRadius: '10px', background: metodoPag === 'BOLETO' ? corPrimaria + '10' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: metodoPag === 'BOLETO' ? corPrimaria : '#666', transition: 'all 0.2s' }}>
                Boleto
              </button>
            )}
          </div>

          {metodoPag === 'PIX' && (
            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#166534', fontWeight: '500' }}>
                <Check size={16} />
                <span>PIX — aprovação instantânea</span>
              </div>
              <div style={{ fontSize: '13px', color: '#15803d', marginTop: '4px' }}>O QR Code será gerado após confirmar</div>
            </div>
          )}

          {metodoPag === 'CARTAO' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Número do cartão" value={cartaoData.numero}
                onChange={(e) => { let v = e.target.value.replace(/\D/g, '').slice(0, 16); v = v.replace(/(\d{4})(?=\d)/g, '$1 '); setCartaoData({ ...cartaoData, numero: v }); }} maxLength={19}
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Nome no cartão" value={cartaoData.nome}
                onChange={(e) => setCartaoData({ ...cartaoData, nome: e.target.value.toUpperCase() })}
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <input type="text" placeholder="MM" value={cartaoData.mes} onChange={(e) => setCartaoData({ ...cartaoData, mes: e.target.value.replace(/\D/g, '').slice(0, 2) })} maxLength={2}
                  style={{ padding: '13px 16px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '15px', outline: 'none' }} />
                <input type="text" placeholder="AA" value={cartaoData.ano} onChange={(e) => setCartaoData({ ...cartaoData, ano: e.target.value.replace(/\D/g, '').slice(0, 2) })} maxLength={2}
                  style={{ padding: '13px 16px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '15px', outline: 'none' }} />
                <input type="text" placeholder="CVV" value={cartaoData.cvv} onChange={(e) => setCartaoData({ ...cartaoData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} maxLength={4}
                  style={{ padding: '13px 16px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '15px', outline: 'none' }} />
              </div>
            </div>
          )}

          {metodoPag === 'BOLETO' && (
            <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '14px', color: '#92400e', fontWeight: '500' }}>Boleto — vencimento em 3 dias úteis</div>
            </div>
          )}
        </div>

        {/* Botão finalizar */}
        <button onClick={handleFinalizar} disabled={processando}
          style={{ width: '100%', padding: '18px', background: processando ? '#ccc' : corPrimaria, color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '700', cursor: processando ? 'not-allowed' : 'pointer', marginBottom: '16px', transition: 'all 0.2s', boxShadow: processando ? 'none' : `0 4px 20px ${corPrimaria}50` }}>
          {processando ? 'Processando...' : `🔒 Finalizar pedido — R$ ${totalComBumps.toFixed(2).replace('.', ',')}`}
        </button>

        {/* Selos de segurança */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
            <ShieldCheck size={16} color="#16a34a" />
            <span>Compra protegida</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
            <Lock size={16} color="#16a34a" />
            <span>Dados criptografados</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
            <Star size={16} color="#f59e0b" />
            <span>Garantia inclusa</span>
          </div>
        </div>

        {plano.checkoutLogoInferior && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <img src={plano.checkoutLogoInferior} alt="Logo" style={{ height: '40px', opacity: 0.6 }} />
          </div>
        )}
      </div>
    </div>
  );
}