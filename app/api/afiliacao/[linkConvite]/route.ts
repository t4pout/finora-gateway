import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { linkConvite: string } }
) {
  try {
    const { linkConvite } = params;

    const produto = await prisma.produto.findUnique({
      where: { linkConvite },
      select: {
        id: true,
        nome: true,
        descricao: true,
        preco: true,
        imagem: true,
        comissaoPadrao: true,
        detalhesAfiliacao: true,
        regrasAfiliacao: true,
        aceitaAfiliados: true,
        aprovacaoAutomatica: true,
        user: {
          select: {
            nome: true
          }
        }
      }
    });

    if (!produto) {
      return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 });
    }

    if (!produto.aceitaAfiliados) {
      return NextResponse.json({ error: 'Este produto não aceita afiliados no momento' }, { status: 400 });
    }

    return NextResponse.json({ success: true, produto });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}