import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Webhook Venit recebido:', JSON.stringify(body));

    const status = body.data?.status || body.status;
    const vendaId = body.data?.externalRef || body.externalRef;
    const pixId = body.data?.id || body.objectId;

    if (!vendaId && !pixId) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    if (status !== 'paid') {
      console.log('Venit status nao pago:', status);
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
      } catch (e) { console.error('Erro Telegram:', e); }
    };

    // Buscar venda por externalRef (vendaId) ou pixId
    let venda = vendaId ? await prisma.venda.findFirst({
      where: { id: vendaId },
      include: { produto: { include: { user: { select: { id: true, nome: true, telegramBotToken: true, telegramChatId: true } } } } }
    }) : null;

    if (!venda && pixId) {
      venda = await prisma.venda.findFirst({
        where: { pixId: String(pixId) },
        include: { produto: { include: { user: { select: { id: true, nome: true, telegramBotToken: true, telegramChatId: true } } } } }
      }) as any;
    }

    if (!venda) {
      console.error('Venda nao encontrada Venit:', vendaId, pixId);
      return NextResponse.json({ error: 'Venda nao encontrada' }, { status: 404 });
    }

    if (venda.status === 'PAGO') {
      return NextResponse.json({ received: true, message: 'Ja processado' });
    }

    await prisma.venda.update({
      where: { id: venda.id },
      data: { status: 'PAGO' }
    });

    console.log('Venda Venit marcada como PAGO:', venda.id);

    // Processar carteira
    try {
      await fetch(baseUrl + '/api/vendas/marcar-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendaId: venda.id })
      });
    } catch (e) { console.error('Erro carteira:', e); }

    // CAPI Purchase
    try {
      if (venda.produtoId) {
        const pixels = await prisma.pixel.findMany({ where: { produtoId: venda.produtoId, plataforma: 'FACEBOOK', ativo: true } });
        for (const px of pixels) {
          if ((px as any).pixelId && (px as any).accessToken) {
            const { dispararEventoCAPI } = await import('@/lib/facebook-capi');
            await dispararEventoCAPI({
              pixelId: (px as any).pixelId,
              accessToken: (px as any).accessToken,
              eventName: 'Purchase',
              value: venda.valor,
              contentName: venda.nomePlano || '',
              contentIds: [venda.produtoId],
              email: venda.compradorEmail,
              phone: venda.compradorTel || ''
            });
          }
        }
      }
    } catch (e) { console.error('Erro CAPI:', e); }

    // Etiqueta Google Slides
    try {
      const webhookEtiqueta = process.env.GOOGLE_SLIDES_WEBHOOK_URL;
      if (webhookEtiqueta) {
        const orderBumpsNomes = (venda as any).orderBumpsNomes || [];
        let produtoLabel = venda.nomePlano || venda.produto?.nome || '';
        if (orderBumpsNomes.length > 0) produtoLabel += ' + ' + orderBumpsNomes.join(' + ');
        await fetch(webhookEtiqueta, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'PAGO', tipo: 'FISICO',
            compradorNome: venda.compradorNome,
            rua: venda.rua, numero: venda.numero,
            complemento: venda.complemento, bairro: venda.bairro,
            cidade: venda.cidade, estado: venda.estado, cep: venda.cep,
            produto: produtoLabel
          })
        });
      }
    } catch (e) { console.error('Erro etiqueta:', e); }

    // Telegram
    const orderBumpsNomes = (venda as any).orderBumpsNomes || [];
    let produtoLabel = venda.nomePlano || venda.produto?.nome || '';
    if (orderBumpsNomes.length > 0) produtoLabel += ' + ' + orderBumpsNomes.join(' + ');

    const mensagem = '✅ <b>VENDA PAGA - VENIT</b>\n\n' +
      '💰 Valor: R$ ' + venda.valor.toFixed(2) + '\n' +
      '👤 Cliente: ' + venda.compradorNome + '\n' +
      '📧 Email: ' + venda.compradorEmail + '\n' +
      '📦 Produto: ' + produtoLabel + '\n' +
      '🟢 PIX confirmado\n' +
      '🆔 Venda ID: ' + venda.id.substring(0, 8);

    const vendedor = venda.produto?.user;
    if (vendedor?.telegramBotToken && vendedor?.telegramChatId) {
      await enviarTelegram(vendedor.telegramBotToken, vendedor.telegramChatId, mensagem);
    }
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await enviarTelegram(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, mensagem + '\n\n🧑 Vendedor: ' + (vendedor?.nome || 'N/A'));
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Erro webhook Venit:', error);
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 });
  }
}