import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const pedidos = await prisma.pedidoPAD.findMany({
      where: { 
        OR: [
          { status: 'EM_ANALISE' },
          { status: 'APROVADO' },
          { status: 'AGUARDANDO_ENVIO' },
          { status: 'AGUARDANDO_PAGAMENTO' }
        ]
      },
      select: {
        id: true,
        hash: true,
        valor: true,
        clienteNome: true,
        clienteEmail: true,
        clienteTelefone: true,
        status: true,
        pixId: true,
        pixQrCode: true,
        pixCopiaECola: true,
        dataPagamento: true,
        createdAt: true,
        produtoNome: true,
        vendedorId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    return NextResponse.json({ pedidos, total: pedidos.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}