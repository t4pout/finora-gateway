import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const orderBumps = await prisma.orderBump.findMany({
      where: { userId, ativo: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orderBumps });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, titulo, descricao, preco } = body;

    if (!userId || !titulo || !preco) {
      return NextResponse.json({ error: 'userId, título e preço são obrigatórios' }, { status: 400 });
    }

    const orderBump = await prisma.orderBump.create({
      data: { userId, titulo, descricao, preco: parseFloat(preco) }
    });

    return NextResponse.json({ orderBump });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}