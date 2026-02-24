import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

function getUserId(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.userId || decoded.id;
  } catch { return null; }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await context.params;
    const body = await request.json();

    const orderBump = await prisma.orderBump.updateMany({
      where: { id, userId },
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        preco: body.preco ? parseFloat(body.preco) : undefined,
        imagem: body.imagem,
        ativo: body.ativo
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await context.params;

    await prisma.orderBump.deleteMany({ where: { id, userId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}