import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const pedidos = await prisma.pedidoPAD.findMany({
      where: { status: 'PENDENTE' },
      select: {
        id: true,
        hash: true,
        valor: true,
        compradorNome: true,
        status: true,
        metodoPagamento: true,
        pixId: true,
        createdAt: true,
        produto: {
          select: {
            nome: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    return NextResponse.json({ pedidos });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}