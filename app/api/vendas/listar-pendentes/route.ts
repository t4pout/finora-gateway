import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const vendas = await prisma.venda.findMany({
      where: { status: 'PENDENTE' },
      select: {
        id: true,
        pixId: true,
        valor: true,
        compradorNome: true,
        status: true,
        createdAt: true,
        produto: {
          select: {
            nome: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    return NextResponse.json({ vendas });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}