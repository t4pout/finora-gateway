import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Criar instância global do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 Iniciando busca de plano...');
    console.log('📦 Prisma está definido?', !!prisma);
    console.log('📦 Prisma.planoOferta está definido?', !!prisma?.planoOferta);
    
    const params = await context.params;
    const planoId = params.id;
    console.log('🔑 Plano ID:', planoId);

    if (!prisma || !prisma.planoOferta) {
      console.error('❌ Prisma ou prisma.plano está undefined!');
      return NextResponse.json(
        { error: 'Erro de configuração do banco de dados' },
        { status: 500 }
      );
    }

    const plano = await prisma.planoOferta.findUnique({
      where: { id: planoId },
      include: {
        produto: true
      }
    });

    console.log('✅ Plano encontrado:', !!plano);

    if (!plano) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ plano });

  } catch (error: any) {
    console.error('❌ ERRO:', error.message);
    return NextResponse.json(
      { error: 'Erro ao buscar plano', details: error.message },
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

    const plano = await prisma.planoOferta.update({
      where: { id: planoId },
      data: body
    });

    return NextResponse.json({ plano });

  } catch (error: any) {
    console.error('Erro ao atualizar plano:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar plano', details: error.message },
      { status: 500 }
    );
  }
}