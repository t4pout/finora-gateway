import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CIELO_MERCHANT_ID = process.env.CIELO_MERCHANT_ID || '';
const CIELO_MERCHANT_KEY = process.env.CIELO_MERCHANT_KEY || '';
const CIELO_API = 'https://apiquery.cieloecommerce.cielo.com.br/1';

// Cielo faz GET para validar a URL
export async function GET() {
  return NextResponse.json({ received: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Webhook Cielo recebido:', JSON.stringify(body, null, 2));

    const { PaymentId, ChangeType } = body;

    if (!PaymentId) {
      return NextResponse.json({ error: 'PaymentId não encontrado' }, { status: 400 });
    }

    // Buscar detalhes do pagamento na Cielo
    const cieloRes = await fetch(`${CIELO_API}/sales/${PaymentId}`, {
      headers: {
        'MerchantId': CIELO_MERCHANT_ID,
        'MerchantKey': CIELO_MERCHANT_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!cieloRes.ok) {
      console.error('❌ Erro ao buscar pagamento Cielo');
      return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: 500 });
    }

    const payment = await cieloRes.json();
    console.log('💰 Pagamento Cielo:', JSON.stringify(payment, null, 2));

    const paymentData = payment.Payment;
    const status = paymentData?.Status;
    const externalRef = paymentData?.ExternalReference || payment.MerchantOrderId;

    // Status 2 = Pago na Cielo
    if (status !== 2) {
      console.log('⏳ Pagamento ainda não aprovado. Status:', status);
      return NextResponse.json({ received: true });
    }

    if (!externalRef) {
      console.error('❌ ExternalReference não encontrado');
      return NextResponse.json({ error: 'Referência não encontrada' }, { status: 400 });
    }

    const origin = request.headers.get('host') || 'finorapayments.com';
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

    // Buscar venda
    const venda = await prisma.venda.findUnique({
      where: { id: externalRef },
      include: {
        produto: {
          include: {
            user: { select: { id: true, nome: true, telegramBotToken: true, telegramChatId: true } }
          }
        }
      }
    });

    if (venda) {
      if (venda.status === 'PAGO') {
        return NextResponse.json({ received: true, message: 'Já processado' });
      }

      const metodoPagamento = paymentData?.Type === 'Pix' ? 'PIX' : paymentData?.Type === 'Boleto' ? 'BOLETO' : 'CARTAO';

      await prisma.venda.update({
        where: { id: externalRef },
        data: { status: 'PAGO', metodoPagamento }
      });

      // Processar carteira
      try {
        await fetch(`${protocol}://${origin}/api/vendas/marcar-pago`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendaId: externalRef })
        });
      } catch (e) { console.error('Erro carteira:', e); }

      // CAPI Purchase
      try {
        if (venda.produtoId) {
          const pixels = await (prisma as any).pixel.findMany({
            where: { produtoId: venda.produtoId, plataforma: 'FACEBOOK', status: 'ATIVO' }
          });
          for (const px of pixels) {
            if (px.pixelId && px.tokenAPI) {
              const { dispararEventoCAPI } = await import('@/lib/facebook-capi');
              await dispararEventoCAPI({
                pixelId: px.pixelId,
                accessToken: px.tokenAPI,
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
      } catch (e) { console.error('Erro CAPI Purchase Cielo:', e); }

      const mensagem = `✅ <b>VENDA PAGA - CIELO</b>\n\n` +
        `💰 Valor: R$ ${venda.valor.toFixed(2)}\n` +
        `👤 Cliente: ${venda.compradorNome}\n` +
        `📧 Email: ${venda.compradorEmail}\n` +
        `📦 Produto: ${venda.nomePlano || ''}\n` +
        `💳 ${metodoPagamento} - Pagamento confirmado\n` +
        `🆔 Venda ID: ${venda.id.substring(0, 8)}`;

      const vendedor = venda.produto?.user;
      if (vendedor?.telegramBotToken && vendedor?.telegramChatId) {
        await enviarTelegram(vendedor.telegramBotToken, vendedor.telegramChatId, mensagem);
      }
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        await enviarTelegram(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, mensagem + `\n\n🧑‍💼 Vendedor: ${vendedor?.nome || 'N/A'}`);
      }

      return NextResponse.json({ received: true, message: 'Venda processada' });
    }

    console.error('❌ Venda não encontrada:', externalRef);
    return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });

  } catch (error: any) {
    console.error('❌ Erro webhook Cielo:', error);
    return NextResponse.json({ error: 'Erro ao processar webhook', details: error.message }, { status: 500 });
  }
}