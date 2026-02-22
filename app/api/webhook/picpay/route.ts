import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('🔔 Webhook PicPay recebido:', JSON.stringify(body, null, 2));

    // Verificar API Key no header
    const apiKey = request.headers.get('authorization');
    if (process.env.PICPAY_WEBHOOK_KEY && apiKey !== process.env.PICPAY_WEBHOOK_KEY) {
      console.error('❌ API Key inválida');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Ignorar eventos que não são pagamento
    if (body.type !== 'PAYMENT') {
      console.log('⏭️ Ignorando evento:', body.type);
      return NextResponse.json({ received: true });
    }

    const transaction = body.data?.transaction;
    if (!transaction || transaction.status !== 'PAYED') {
      console.log('⏳ Transação ainda não paga:', transaction?.status);
      return NextResponse.json({ received: true });
    }

    // O merchantChargeId é o vendaId que passamos na criação
    const paymentLinkId = body.data?.charge?.paymentLinkId;
    if (!paymentLinkId) {
      console.error('❌ paymentLinkId não encontrado');
      return NextResponse.json({ error: 'paymentLinkId não encontrado' }, { status: 400 });
    }

    const origin = request.headers.get('host') || 'www.finorapayments.com';
    const protocol = origin.includes('localhost') ? 'http' : 'https';

    const enviarTelegram = async (botToken: string, chatId: string, mensagem: string) => {
      try {
        await fetch(`${protocol}://${origin}/api/telegram/notificar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botToken, chatId, mensagem })
        });
      } catch (e) {
        console.error('Erro notificação Telegram:', e);
      }
    };

    // Mapear tipo de pagamento
    let metodoPagamento = 'PIX';
    if (transaction.paymentType === 'CREDIT_CARD') metodoPagamento = 'CARTAO';
    else if (transaction.paymentType === 'WALLET') metodoPagamento = 'PICPAY';

    const metodoEmoji = metodoPagamento === 'PIX' ? '🟢 PIX' 
      : metodoPagamento === 'CARTAO' ? '💳 Cartão' 
      : '💙 Carteira PicPay';

    // ==========================================
    // CASO 1: Venda normal
    // ==========================================
    const venda = await prisma.venda.findFirst({
      where: { pixId: paymentLinkId },
      include: {
        produto: {
          include: {
            user: {
              select: { id: true, nome: true, telegramBotToken: true, telegramChatId: true }
            }
          }
        }
      }
    });

    if (venda) {
      if (venda.status === 'PAGO') {
        console.log('✅ Venda já foi paga anteriormente');
        return NextResponse.json({ received: true, message: 'Já processado' });
      }

      await prisma.venda.update({
        where: { id: venda.id },
        data: { status: 'PAGO', metodoPagamento }
      });

      console.log('✅ Venda marcada como PAGO:', venda.id);

      try {
        await fetch(`${protocol}://${origin}/api/vendas/marcar-pago`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendaId: venda.id })
        });
      } catch (e) {
        console.error('Erro ao processar carteira:', e);
      }

      const mensagem = `✅ <b>VENDA PAGA</b>\n\n` +
        `💰 Valor: R$ ${venda.valor.toFixed(2)}\n` +
        `👤 Cliente: ${venda.compradorNome}\n` +
        `📧 Email: ${venda.compradorEmail}\n` +
        `📦 Produto: ${venda.nomePlano || venda.produto?.nome || ''}\n` +
        `${metodoEmoji} - Pagamento confirmado\n` +
        `🆔 Venda ID: ${venda.id.substring(0, 8)}`;

      const vendedor = venda.produto?.user;
      if (vendedor?.telegramBotToken && vendedor?.telegramChatId) {
        await enviarTelegram(vendedor.telegramBotToken, vendedor.telegramChatId, mensagem);
      }
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        await enviarTelegram(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID,
          mensagem + `\n\n🧑‍💼 Vendedor: ${vendedor?.nome || 'N/A'}`);
      }

      return NextResponse.json({ received: true, message: 'Venda processada com sucesso' });
    }

    // ==========================================
    // CASO 2: PedidoPAD
    // ==========================================
    const pedido = await prisma.pedidoPAD.findFirst({
      where: { hash: paymentLinkId },
      include: {
        produto: {
          include: {
            user: {
              select: { id: true, nome: true, telegramBotToken: true, telegramChatId: true }
            }
          }
        }
      }
    });

    if (pedido) {
      if (pedido.vendaId) {
        console.log('✅ Pagamento PAD já processado');
        return NextResponse.json({ received: true, message: 'Já processado' });
      }

      const novaVenda = await prisma.venda.create({
        data: {
          valor: pedido.valor,
          status: 'PAGO',
          metodoPagamento,
          compradorNome: pedido.clienteNome,
          compradorEmail: pedido.clienteEmail || '',
          compradorCpf: pedido.clienteCpfCnpj,
          compradorTel: pedido.clienteTelefone,
          cep: pedido.cep,
          rua: pedido.rua,
          numero: pedido.numero,
          complemento: pedido.complemento,
          bairro: pedido.bairro,
          cidade: pedido.cidade,
          estado: pedido.estado,
          produtoId: pedido.produtoId,
          vendedorId: pedido.vendedorId
        }
      });

      await fetch(`${protocol}://${origin}/api/pad/processar-aprovacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoPadHash: pedido.hash, vendaId: novaVenda.id })
      });

      const mensagemPAD = `✅ <b>PAD PAGO</b>\n\n` +
        `💰 Valor: R$ ${pedido.valor.toFixed(2)}\n` +
        `👤 Cliente: ${pedido.clienteNome}\n` +
        `📦 Produto: ${pedido.produtoNome}\n` +
        `${metodoEmoji} - Pagamento confirmado\n` +
        `🆔 Pedido: ${pedido.hash}`;

      const vendedor = pedido.produto?.user;
      if (vendedor?.telegramBotToken && vendedor?.telegramChatId) {
        await enviarTelegram(vendedor.telegramBotToken, vendedor.telegramChatId, mensagemPAD);
      }
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        await enviarTelegram(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID,
          mensagemPAD + `\n\n🧑‍💼 Vendedor: ${vendedor?.nome || 'N/A'}`);
      }

      return NextResponse.json({ received: true, message: 'PAD processado com sucesso' });
    }

    console.error('❌ paymentLinkId não encontrado em Venda nem PedidoPAD:', paymentLinkId);
    return NextResponse.json({ error: 'Referência não encontrada' }, { status: 404 });

  } catch (error: any) {
    console.error('❌ Erro webhook PicPay:', error);
    return NextResponse.json({ error: 'Erro ao processar webhook', details: error.message }, { status: 500 });
  }
}