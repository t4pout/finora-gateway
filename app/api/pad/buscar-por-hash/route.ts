import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { hash } = await request.json();
    
    console.log('🔍 Buscando pedido PAD com hash:', hash);
    
    const pedido = await prisma.pedidoPAD.findUnique({
      where: { hash: hash },
      include: {
        produto: {
          select: {
            nome: true,
            userId: true
          }
        }
      }
    });
    
    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ pedido });
    
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}