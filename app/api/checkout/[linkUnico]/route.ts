import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkUnico: string }> }
) {
  try {
    const { linkUnico } = await params;

    const plano = await prisma.planoOferta.findUnique({
      where: { linkUnico },
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            imagem: true,
            userId: true
          }
        }
      }
    });

    if (!plano) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    if (!plano.ativo) {
      return NextResponse.json({ error: 'Plano inativo' }, { status: 403 });
    }

    return NextResponse.json({ plano, produto: plano.produto });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar plano' }, { status: 500 });
  }
}
