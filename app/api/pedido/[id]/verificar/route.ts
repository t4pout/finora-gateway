import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PAGGPIX_TOKEN = process.env.PAGGPIX_TOKEN;
const PAGGPIX_API = 'https://public-api.paggpix.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const venda = await prisma.venda.findUnique({
      where: { id }
    });

    if (!venda) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Se já está pago, retorna direto
    if (venda.status === 'PAGO' || venda.status === 'APROVADO') {
      return NextResponse.json({ status: venda.status });
    }

    // Verificar no PaggPix
    if (venda.pixId) {
      try {
        const verifyRes = await fetch(`${PAGGPIX_API}/payments/${venda.pixId}/verify`, {
          headers: {
            'Authorization': `Bearer ${PAGGPIX_TOKEN}`
          }
        });

        if (verifyRes.ok) {
          const paggpixData = await verifyRes.json();
          
          // Se foi pago no PaggPix, atualizar no banco
          if (paggpixData.paid || paggpixData.status === 'PAID' || paggpixData.status === 'paid') {
            await prisma.venda.update({
              where: { id },
              data: { status: 'PAGO' }
            });
            
            return NextResponse.json({ status: 'PAGO' });
          }
        }
      } catch (error) {
        console.error('Erro ao verificar no PaggPix:', error);
      }
    }
    
    return NextResponse.json({ status: venda.status });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao verificar pagamento' }, { status: 500 });
  }
}