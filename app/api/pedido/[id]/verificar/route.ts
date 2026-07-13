import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processarVendaPaga } from '@/lib/processar-venda-paga';

const PAGGPIX_TOKEN = process.env.PAGGPIX_TOKEN;
const PAGGPIX_API = 'https://public-api.paggpix.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🔍 Verificando pedido:', id);
    
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        produto: {
          include: {
            user: true
          }
        }
      }
    });

    if (!venda) {
      console.log('❌ Pedido não encontrado');
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    console.log('📊 Status atual da venda:', venda.status);

    // Se já está pago, retorna direto
    if (venda.status === 'PAGO' || venda.status === 'APROVADO') {
      console.log('✅ Venda já estava PAGA');
      return NextResponse.json({ status: venda.status });
    }

    // Verificar no PaggPix
    if (venda.pixId) {
      console.log('🔄 Consultando PaggPix, pixId:', venda.pixId);
      
      try {
        const verifyRes = await fetch(`${PAGGPIX_API}/payments/${venda.pixId}/verify`, {
          headers: {
            'Authorization': `Bearer ${PAGGPIX_TOKEN}`
          }
        });

        console.log('📡 Status resposta PaggPix:', verifyRes.status);

        if (verifyRes.ok) {
          const paggpixData = await verifyRes.json();
          console.log('📦 Dados PaggPix:', JSON.stringify(paggpixData));
          
          // Se foi pago no PaggPix, processar tudo (split, carteira, Telegram, push, NF-e)
          if (paggpixData.paid || paggpixData.status === 'PAID' || paggpixData.status === 'paid') {
            console.log('💰 PAGAMENTO CONFIRMADO! Processando venda...');

            const resultado = await processarVendaPaga(id);

            if ('error' in resultado) {
              console.error('❌ Erro ao processar venda paga:', resultado.error);
              return NextResponse.json({ error: resultado.error }, { status: resultado.status });
            }

            console.log('✅ Venda processada completamente:', id);

            return NextResponse.json({ status: 'PAGO' });
          } else {
            console.log('⏳ Ainda não foi pago no PaggPix');
          }
        } else {
          console.log('⚠️ Erro na resposta PaggPix:', verifyRes.statusText);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar no PaggPix:', error);
      }
    } else {
      console.log('⚠️ Venda sem pixId');
    }
    
    console.log('📤 Retornando status:', venda.status);
    return NextResponse.json({ status: venda.status });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ error: 'Erro ao verificar pagamento' }, { status: 500 });
  }
}