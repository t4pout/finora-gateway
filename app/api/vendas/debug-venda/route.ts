import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    const venda = await prisma.venda.findFirst({
      where: {
        compradorEmail: email
      },
      include: {
        produto: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!venda) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ venda });
    
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}