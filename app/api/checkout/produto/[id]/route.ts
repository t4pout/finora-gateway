import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const produto = await prisma.produto.findFirst({
      where: {
        id,
        status: 'ATIVO'
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
        preco: true,
        tipo: true
      }
    });

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado ou inativo' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      produto
    });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  }
}
