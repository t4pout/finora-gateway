import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planoId } = await context.params;

    const plano = await prisma.plano.findUnique({
      where: { id: planoId },
      include: {
        produto: true
      }
    });

    if (!plano) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ plano });

  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar plano' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!);
    
    const { id: planoId } = await context.params;
    const body = await request.json();

    const plano = await prisma.plano.update({
      where: { id: planoId },
      data: body
    });

    return NextResponse.json({ plano });

  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar plano' },
      { status: 500 }
    );
  }
}