import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarEmailEbook } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { vendaId } = await request.json();

    const venda = await prisma.venda.findUnique({
      where: { id: vendaId },
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            arquivoUrl: true
          }
        }
      }
    });

    if (!venda) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
    if (venda.produto?.tipo !== 'DIGITAL') return NextResponse.json({ error: 'Produto não é digital' }, { status: 400 });
    if (!venda.produto?.arquivoUrl) return NextResponse.json({ error: 'Produto não tem arquivo' }, { status: 400 });

    await enviarEmailEbook({
      compradorNome: venda.compradorNome,
      compradorEmail: venda.compradorEmail,
      produtoNome: venda.produto.nome,
      planoNome: venda.nomePlano || venda.produto.nome,
      valor: venda.valor,
      pedidoId: venda.id,
      arquivoUrl: venda.produto.arquivoUrl
    });

    return NextResponse.json({ success: true, message: 'Ebook reenviado para ' + venda.compradorEmail });
  } catch (error: any) {
    console.error('Erro ao reenviar ebook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}