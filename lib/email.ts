import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Finora <noreply@finorapayments.com>';

export async function enviarEmailPedidoCriado(dados: {
  compradorNome: string;
  compradorEmail: string;
  produtoNome: string;
  planoNome: string;
  valor: number;
  metodoPagamento: string;
  pedidoId: string;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: dados.compradorEmail,
      subject: `⏳ Pedido recebido - ${dados.produtoNome}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">Finora</h1>
              <p style="color: #6b7280; margin: 4px 0 0;">Pagamentos que fluem</p>
            </div>
            <h2 style="color: #111827; font-size: 20px;">Olá, ${dados.compradorNome}! 👋</h2>
            <p style="color: #374151; font-size: 16px;">Seu pedido foi recebido com sucesso. ${dados.metodoPagamento === 'PIX' ? 'Aguardando confirmação do pagamento via PIX.' : 'Estamos processando seu pagamento.'}</p>
            
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #111827; margin: 0 0 12px;">Resumo do Pedido</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="color: #6b7280; padding: 6px 0;">Produto</td><td style="color: #111827; font-weight: 600; text-align: right;">${dados.produtoNome}</td></tr>
                <tr><td style="color: #6b7280; padding: 6px 0;">Plano</td><td style="color: #111827; font-weight: 600; text-align: right;">${dados.planoNome}</td></tr>
                <tr><td style="color: #6b7280; padding: 6px 0;">Valor</td><td style="color: #7c3aed; font-weight: 700; font-size: 18px; text-align: right;">R$ ${dados.valor.toFixed(2).replace('.', ',')}</td></tr>
                <tr><td style="color: #6b7280; padding: 6px 0;">Pagamento</td><td style="color: #111827; font-weight: 600; text-align: right;">${dados.metodoPagamento}</td></tr>
                <tr><td style="color: #6b7280; padding: 6px 0;">Pedido</td><td style="color: #111827; font-weight: 600; text-align: right;">#${dados.pedidoId.slice(-8).toUpperCase()}</td></tr>
              </table>
            </div>

            ${dados.metodoPagamento === 'PIX' ? `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #166534; margin: 0; font-size: 14px;">✅ Acesse a página do seu pedido para visualizar o QR Code do PIX e efetuar o pagamento.</p>
            </div>
            ` : ''}

            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px;">Dúvidas? Entre em contato conosco.<br/>Este email foi enviado automaticamente, não responda.</p>
          </div>
        </div>
      `
    });
    console.log('✅ Email pedido criado enviado para:', dados.compradorEmail);
  } catch (error) {
    console.error('❌ Erro ao enviar email pedido criado:', error);
  }
}

export async function enviarEmailPagamentoAprovado(dados: {
  compradorNome: string;
  compradorEmail: string;
  produtoNome: string;
  planoNome: string;
  valor: number;
  metodoPagamento: string;
  pedidoId: string;
  tipoProduto: string;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: dados.compradorEmail,
      subject: `✅ Pagamento confirmado - ${dados.produtoNome}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">Finora</h1>
              <p style="color: #6b7280; margin: 4px 0 0;">Pagamentos que fluem</p>
            </div>
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 64px; height: 64px; background: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px;">✅</div>
            </div>
            <h2 style="color: #111827; font-size: 20px; text-align: center;">Pagamento Confirmado!</h2>
            <p style="color: #374151; font-size: 16px;">Olá, <strong>${dados.compradorNome}</strong>! Seu pagamento foi confirmado com sucesso.</p>
            
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #111827; margin: 0 0 12px;">Resumo do Pedido</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="color: #6b7280; padding: 6px 0;">Produto</td><td style="color: #111827; font-weight: 600; text-align: right;">${dados.produtoNome}</td></tr>
                <tr><td style="color: #6b7280; padding: 6px 0;">Plano</td><td style="color: #111827; font-weight: 600; text-align: right;">${dados.planoNome}</td></tr>
                <tr><td style="color: #6b7280; padding: 6px 0;">Valor Pago</td><td style="color: #059669; font-weight: 700; font-size: 18px; text-align: right;">R$ ${dados.valor.toFixed(2).replace('.', ',')}</td></tr>
                <tr><td style="color: #6b7280; padding: 6px 0;">Método</td><td style="color: #111827; font-weight: 600; text-align: right;">${dados.metodoPagamento}</td></tr>
                <tr><td style="color: #6b7280; padding: 6px 0;">Pedido</td><td style="color: #111827; font-weight: 600; text-align: right;">#${dados.pedidoId.slice(-8).toUpperCase()}</td></tr>
              </table>
            </div>

            ${dados.tipoProduto === 'FISICO' ? `
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #1e40af; margin: 0; font-size: 15px;">📦 <strong>Produto físico:</strong> Estamos separando seu pedido para envio. Você receberá uma notificação quando o produto sair para entrega!</p>
            </div>
            ` : `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #166534; margin: 0; font-size: 15px;">🎉 <strong>Obrigado pela sua compra!</strong> Seu pedido está sendo processado.</p>
            </div>
            `}

            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px;">Dúvidas? Entre em contato conosco.<br/>Este email foi enviado automaticamente, não responda.</p>
          </div>
        </div>
      `
    });
    console.log('✅ Email pagamento aprovado enviado para:', dados.compradorEmail);
  } catch (error) {
    console.error('❌ Erro ao enviar email pagamento aprovado:', error);
  }
}

export async function enviarEmailEmSeparacao(dados: {
  compradorNome: string;
  compradorEmail: string;
  produtoNome: string;
  pedidoId: string;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: dados.compradorEmail,
      subject: `📦 Seu pedido está sendo separado - ${dados.produtoNome}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">Finora</h1>
            </div>
            <div style="text-align: center; margin-bottom: 24px; font-size: 48px;">📦</div>
            <h2 style="color: #111827; text-align: center;">Pedido em Separação!</h2>
            <p style="color: #374151; font-size: 16px;">Olá, <strong>${dados.compradorNome}</strong>! Boas notícias — seu pedido <strong>#${dados.pedidoId.slice(-8).toUpperCase()}</strong> está sendo separado para envio.</p>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #1e40af; margin: 0;">🚚 Em breve você receberá o código de rastreamento para acompanhar sua entrega!</p>
            </div>
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px;">Este email foi enviado automaticamente, não responda.</p>
          </div>
        </div>
      `
    });
    console.log('✅ Email em separação enviado para:', dados.compradorEmail);
  } catch (error) {
    console.error('❌ Erro ao enviar email em separação:', error);
  }
}

export async function enviarEmailSaiuParaEntrega(dados: {
  compradorNome: string;
  compradorEmail: string;
  produtoNome: string;
  pedidoId: string;
  codigoRastreamento?: string;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: dados.compradorEmail,
      subject: `🚚 Seu pedido saiu para entrega - ${dados.produtoNome}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">Finora</h1>
            </div>
            <div style="text-align: center; margin-bottom: 24px; font-size: 48px;">🚚</div>
            <h2 style="color: #111827; text-align: center;">Pedido Saiu para Entrega!</h2>
            <p style="color: #374151; font-size: 16px;">Olá, <strong>${dados.compradorNome}</strong>! Seu pedido <strong>#${dados.pedidoId.slice(-8).toUpperCase()}</strong> saiu para entrega!</p>
            ${dados.codigoRastreamento ? `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="color: #166534; margin: 0 0 8px; font-size: 14px;">Código de Rastreamento</p>
              <p style="color: #111827; font-size: 22px; font-weight: 700; font-family: monospace; margin: 0;">${dados.codigoRastreamento}</p>
            </div>
            ` : ''}
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #1e40af; margin: 0;">📍 Fique atento — seu pedido chegará em breve!</p>
            </div>
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px;">Este email foi enviado automaticamente, não responda.</p>
          </div>
        </div>
      `
    });
    console.log('✅ Email saiu para entrega enviado para:', dados.compradorEmail);
  } catch (error) {
    console.error('❌ Erro ao enviar email saiu para entrega:', error);
  }
}