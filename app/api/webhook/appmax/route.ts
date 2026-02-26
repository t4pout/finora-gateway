import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Webhook Appmax recebido:', JSON.stringify(body));

    // Appmax envia status: approved, pending, refused, etc
    const status = body.data?.status || body.status;
    const orderId = body.data?.order_id || body.order_id;

    if (!orderId) {
      console.error('order_id nao encontrado no webhook Appmax');
      return NextResponse.json({ error: 'order_id nao encontrado' }, { status: 400 });
    }

    if (status !== 'approved' && status !== 'paid') {
      console.log('Pagamento Appmax nao aprovado ainda:', status);
      return NextResponse.json({ received: true });
    }

    const origin = request.headers.get('host') || 'finorapayments.com';
    const protocol = origin.includes('localhost') ? 'http' : 'https';
    const baseUrl = protocol + '://' + origin;

    const enviarTelegram = async (botToken: string, chatId: string, mensagem: string) => {
      try {
        await fetch(baseUrl + '/api/telegram/notificar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botToken, chatId, mensagem })
        });
      } catch (e) {
        console.error('Erro notificacao Telegram:', e);
      }
    };

    const dispararCAPI = async (produtoId: string, valor: number, nome: string, email: string, tel: string) => {
      try {
        const pixels = await prisma.pixel.findMany({
          where: { produtoId, plataforma: 'FACEBOOK', ativo: true }
        });
        for (const px of pixels) {
          if ((px as any).pixelId && (px as any).accessToken) {
            const { dispararEventoCAPI } = await import('@/lib/facebook-capi');
            await dispararEventoCAPI({
              pixelId: (px as any).pixelId,
              accessToken: (px as any).accessToken,
              eventName: 'Purchase',
              value: valor,
              contentName: nome,
              contentIds: [produtoId],
              email,
              phone: tel
            });
          }
        }
      } catch (e) {
        console.error('Erro CAPI Purchase:', e);
      }
    };

    const enviarEtiqueta = async (venda: any, produtoNome: string) => {
      const webhookEtiqueta = process.env.GOOGLE_SLIDES_WEBHOOK_URL;
      if (!webhookEtiqueta) return;
      try {
        await fetch(webhookEtiqueta, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'PAGO',
            tipo: 'FISICO',
            compradorNome: venda.compradorNome,
            rua: venda.rua,
            numero: venda.numero,
            complemento: venda.complemento,
            bairro: venda.bairro,
            cidade: venda.cidade,
            estado: venda.estado,
            cep: venda.cep,
            produto: produtoNome
          })
        });
        console.log('Etiqueta enviada para Google Slides');
      } catch (e) {
        console.error('Erro ao enviar etiqueta:', e);
      }
    };

    // Buscar venda pelo pixId (onde salvamos o orderId da Appmax)
    const vendaExistente = await prisma.venda.findFirst({
      where: { pixId: String(orderId) },
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

    if (!vendaExistente) {
      console.error('Venda nao encontrada para orderId Appmax:', orderId);
      return NextResponse.json({ error: 'Venda nao encontrada' }, { status: 404 });
    }

    if (vendaExistente.status === 'PAGO') {
      console.log('Venda ja foi paga anteriormente');
      return NextResponse.json({ received: true, message: 'Ja processado' });
    }

    const metodoPagamento = vendaExistente.metodoPagamento;

    await prisma.venda.update({
      where: { id: vendaExistente.id },
      data: { status: 'PAGO' }
    });

    console.log('Venda marcada como PAGO:', vendaExistente.id);

    // Processar carteira do vendedor
    try {
      await fetch(baseUrl + '/api/vendas/marcar-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendaId: vendaExistente.id })
      });
    } catch (e) {
      console.error('Erro ao processar carteira:', e);
    }

    // CAPI Purchase
    if (vendaExistente.produtoId) {
      await dispararCAPI(
        vendaExistente.produtoId,
        vendaExistente.valor,
        vendaExistente.nomePlano || '',
        vendaExistente.compradorEmail,
        vendaExistente.compradorTel || ''
      );
    }

    // Etiqueta
    const orderBumpsNomes = (vendaExistente as any).orderBumpsNomes || [];
    let produtoLabel = vendaExistente.nomePlano || vendaExistente.produto?.nome || '';
    if (orderBumpsNomes.length > 0) {
      produtoLabel += ' + ' + orderBumpsNomes.join(' + ');
    }
    await enviarEtiqueta(vendaExistente, produtoLabel);

    // Telegram
    const metodoEmoji = metodoPagamento === 'PIX' ? 'PIX' : metodoPagamento === 'BOLETO' ? 'Boleto' : 'Cartao';
    const mensagem = '✅ <b>VENDA PAGA - APPMAX</b>\n\n' +
      '💰 Valor: R$ ' + vendaExistente.valor.toFixed(2) + '\n' +
      '👤 Cliente: ' + vendaExistente.compradorNome + '\n' +
      '📧 Email: ' + vendaExistente.compradorEmail + '\n' +
      '📦 Produto: ' + produtoLabel + '\n' +
      '💳 ' + metodoEmoji + ' - Pagamento confirmado\n' +
      '🆔 Venda ID: ' + vendaExistente.id.substring(0, 8);

    const vendedor = vendaExistente.produto?.user;
    if (vendedor?.telegramBotToken && vendedor?.telegramChatId) {
      await enviarTelegram(vendedor.telegramBotToken, vendedor.telegramChatId, mensagem);
    }
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await enviarTelegram(
        process.env.TELEGRAM_BOT_TOKEN,
        process.env.TELEGRAM_CHAT_ID,
        mensagem + '\n\n🧑 Vendedor: ' + (vendedor?.nome || 'N/A')
      );
    }

    return NextResponse.json({ received: true, message: 'Pagamento processado com sucesso' });

  } catch (error: any) {
    console.error('Erro ao processar webhook Appmax:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook', details: error.message },
      { status: 500 }
    );
  }
}