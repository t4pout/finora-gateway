import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Webhook Efi recebido COMPLETO:', JSON.stringify(body));

    const origin = req.headers.get('host') || 'finorapayments.com';
    const protocol = origin.includes('localhost') ? 'http' : 'https';

    const enviarTelegram = async (botToken: string, chatId: string, mensagem: string) => {
      try {
        await fetch(`${protocol}://${origin}/api/telegram/notificar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botToken, chatId, mensagem })
        });
      } catch (e) { console.error('Erro Telegram:', e); }
    };

    const processarVendaPaga = async (vendaId: string) => {
      const venda = await prisma.venda.findUnique({
        where: { id: vendaId },
        include: {
          produto: {
            include: {
              user: { select: { id: true, nome: true, telegramBotToken: true, telegramChatId: true } }
            }
          }
        }
      });

      if (!venda) { console.log('Venda não encontrada:', vendaId); return; }
      if (venda.status === 'PAGO') { console.log('Venda já paga:', vendaId); return; }

      await prisma.venda.update({ where: { id: vendaId }, data: { status: 'PAGO' } });

      // Carteira
      try {
        await fetch(`${protocol}://${origin}/api/vendas/marcar-pago`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendaId })
        });
      } catch (e) { console.error('Erro carteira:', e); }

      // CAPI Purchase
      try {
        if (venda.produtoId) {
          const pixels = await (prisma as any).pixel.findMany({
            where: { produtoId: venda.produtoId, plataforma: 'FACEBOOK', ativo: true }
          }).catch(() => []);
          for (const px of pixels) {
            if (px.pixelId && px.accessToken) {
              const { dispararEventoCAPI } = await import('@/lib/facebook-capi');
              await dispararEventoCAPI({
                pixelId: px.pixelId,
                accessToken: px.accessToken,
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
      } catch (e) { console.error('Erro CAPI Purchase:', e); }

      // Telegram
      const mensagem = `✅ <b>VENDA PAGA</b>\n\n` +
        `💰 Valor: R$ ${venda.valor.toFixed(2)}\n` +
        `👤 Cliente: ${venda.compradorNome}\n` +
        `📧 Email: ${venda.compradorEmail}\n` +
        `📦 Produto: ${venda.nomePlano || venda.produto?.nome || ''}\n` +
        `💳 ${venda.metodoPagamento} - Pagamento confirmado\n` +
        `🆔 Venda ID: ${venda.id.substring(0, 8)}`;

      const vendedor = venda.produto?.user;
      if (vendedor?.telegramBotToken && vendedor?.telegramChatId) {
        await enviarTelegram(vendedor.telegramBotToken, vendedor.telegramChatId, mensagem);
      }
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        await enviarTelegram(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, mensagem + `\n\n🧑‍💼 Vendedor: ${vendedor?.nome || 'N/A'}`);
      }

      console.log(`✅ Venda ${vendaId} processada com sucesso!`);
    };

    // Webhook PIX
    if (body.pix) {
      for (const pix of body.pix) {
        const txid = pix.txid;
        const valor = pix.valor;
        console.log(`PIX confirmado: txid=${txid} valor=${valor}`);
        // Só processa se tiver valor real (webhook real do Efi sempre tem valor)
        if (!valor || valor === '0') {
          console.log(`PIX ignorado - valor inválido: ${valor}`);
          continue;
        }
        const venda = await prisma.venda.findFirst({ where: { pixTxid: txid } });
        if (venda) await processarVendaPaga(venda.id);
      }
    }

    // Webhook Boleto/Cartão
    if (body.event === 'charge.status.changed') {
      const chargeId = body.data?.charge_id;
      const status = body.data?.status;
      if (status === 'paid') {
        console.log(`Cobrança paga: chargeId=${chargeId}`);
        const venda = await prisma.venda.findFirst({ where: { efiChargeId: String(chargeId) } });
        if (venda) await processarVendaPaga(venda.id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Erro webhook Efi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  console.log('Webhook Efi GET recebido - validação');
  return new NextResponse('', { status: 200 });
}
