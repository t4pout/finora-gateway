import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import efipay from '@/lib/efi';

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
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      select: { id: true, pixTxid: true }
    });

    console.log(`🔍 Verificando ${vendasPendentes.length} PIX pendentes...`);

    let atualizadas = 0;

    for (const venda of vendasPendentes) {
      try {
        const cob = await efipay.pixDetailCharge({ txid: venda.pixTxid! }, {});
        if (cob.status === 'CONCLUIDA') {
          await prisma.venda.update({
            where: { id: venda.id },
            data: { status: 'PAGO' }
          });
          atualizadas++;
          console.log(`✅ PIX confirmado via cron: ${venda.id}`);
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