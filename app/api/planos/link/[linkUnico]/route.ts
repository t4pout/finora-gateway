import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ? new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ linkUnico: string }> }
) {
  try {
    const params = await context.params;
    const { linkUnico } = params;

    console.log('🔍 Buscando plano por link único:', linkUnico);

    const plano = await prisma.planoOferta.findUnique({
      where: { linkUnico },
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            imagem: true
          }
        }
      }
    });

    if (!plano) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Plano encontrado:', plano.nome);

    return NextResponse.json({ plano });
  } catch (error: any) {
    console.error('❌ Erro ao buscar plano:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}