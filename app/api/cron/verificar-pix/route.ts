import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createEfiPay } from '@/lib/efi';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization');
  if (secret !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const vendasPendentes = await prisma.venda.findMany({
      where: {
        status: 'PENDENTE',
        metodoPagamento: 'PIX',
        pixTxid: { not: null },
        pixId: null,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      select: { id: true, pixTxid: true }
    });

    console.log(`🔍 Cron: verificando ${vendasPendentes.length} PIX pendentes...`);
     
    let atualizadas = 0; 
    const origin = req.headers.get('host') || 'finorapayments.com';
    const protocol = 'https';

    for (const venda of vendasPendentes) {
      try {
        const efipay = createEfiPay();
        const cob = await efipay.pixDetailCharge({ txid: venda.pixTxid! }, {});
        if (cob.status === 'CONCLUIDA') {
          const webhookRes = await fetch(`${protocol}://${origin}/api/efi/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pix: [{ txid: venda.pixTxid, valor: '1', horario: new Date().toISOString() }] })
          });
          const webhookData = await webhookRes.json();
          atualizadas++;
          console.log(`✅ Cron: PIX confirmado ${venda.id} - webhook: ${JSON.stringify(webhookData)}`);
        }
      } catch (e) {
        console.error(`Erro ao verificar PIX ${venda.pixTxid}:`, e);
      }
    }

    return NextResponse.json({ ok: true, verificadas: vendasPendentes.length, atualizadas });
  } catch (error: any) {
    console.error('Erro cron PIX:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}