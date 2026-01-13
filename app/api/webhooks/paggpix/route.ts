import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const VERIFY_TOKEN = process.env.PAGGPIX_WEBHOOK_TOKEN || 'finora-webhook-secure-token-2026';

export async function GET(request: NextRequest) {
  // Verificação do webhook
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const challenge = searchParams.get('challenge');
  const verifyToken = request.headers.get('x-verify-token');

  if (mode === 'subscribe' && verifyToken === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid verification' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paggpix-signature');
    const body = await request.text();

    // Verificar assinatura HMAC
    const hmac = crypto.createHmac('sha256', VERIFY_TOKEN);
    const expectedSignature = `sha256=${hmac.update(body).digest('hex')}`;

    if (signature !== expectedSignature) {
      console.error('Assinatura inválida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const event = JSON.parse(body);
    console.log('Webhook recebido:', event);

    // Processar evento de pagamento
    if (event.event === 'PAYMENT' && event.data) {
      const { pix_id, status } = event.data;

      if (status === 'DONE') {
        // Buscar venda pelo pixId
        const venda = await prisma.venda.findFirst({
          where: { pixId: pix_id }
        });

        if (venda && venda.status === 'PENDENTE') {
          // Atualizar status para PAGO
          await prisma.venda.update({
            where: { id: venda.id },
            data: { status: 'PAGO' }
          });

          console.log(`✅ Venda ${venda.id} confirmada!`);

          // TODO: Aqui você pode:
          // - Liberar produto digital
          // - Enviar email de confirmação
          // - Calcular comissões
          // - Liberar saldo na carteira
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
