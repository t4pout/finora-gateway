import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Webhook Efi recebido COMPLETO:', JSON.stringify(body));

    // Webhook PIX
    if (body.pix) {
      for (const pix of body.pix) {
        const txid = pix.txid;
        const valor = pix.valor;

        await prisma.venda.updateMany({
          where: { pixTxid: txid },
          data: { status: 'PAGO' },
        });

        console.log(`PIX confirmado: txid=${txid} valor=${valor}`);
      }
    }

    // Webhook Boleto/Cartão
    if (body.event === 'charge.status.changed') {
      const chargeId = body.data?.charge_id;
      const status = body.data?.status;

      if (status === 'paid') {
        await prisma.venda.updateMany({
          where: { efiChargeId: chargeId },
          data: { status: 'PAGO' },
        });
        console.log(`Cobrança paga: chargeId=${chargeId}`);
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