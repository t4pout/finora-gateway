import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkConvite: string }> }
) {
  try {
    const { linkConvite } = await params;

    const produto = await prisma.produto.findUnique({
      where: { linkConvite },
      select: {
        id: true,
        nome: true,
        descricao: true,
        preco: true,
        imagem: true,
        aceitaAfiliados: true,
        aprovacaoAutomatica: true,
        comissaoPadrao: true,
        detalhesAfiliacao: true,
        regrasAfiliacao: true,
        user: {
          select: {
            nome: true
          }
        }
      }
    });

    if (!produto) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 });
    }

    if (!produto.aceitaAfiliados) {
      return NextResponse.json({ error: 'Este produto não aceita afiliados' }, { status: 400 });
    }

    return NextResponse.json({ produto });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 });
  }
}
