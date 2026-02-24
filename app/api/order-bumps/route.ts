import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

function getUserId(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('🔍 JWT decoded:', JSON.stringify(decoded));
    return decoded.userId || decoded.id || decoded.sub;
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

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
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { titulo, descricao, preco, imagem } = body;

    if (!titulo || !preco) {
      return NextResponse.json({ error: 'Título e preço são obrigatórios' }, { status: 400 });
    }

    const orderBump = await prisma.orderBump.create({
      data: { userId, titulo, descricao, preco: parseFloat(preco), imagem }
    });

    return NextResponse.json({ orderBump });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}