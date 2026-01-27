import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const produtoId = searchParams.get('produtoId');

    if (!produtoId) {
      return NextResponse.json({ error: 'produtoId é obrigatório' }, { status: 400 });
    }

    const pixels = await prisma.pixelConversao.findMany({
      where: { produtoId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ pixels });

  } catch (error: any) {
    console.error('Erro ao buscar pixels:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pixels', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const pixel = await prisma.pixelConversao.create({
      data: {
        produtoId: body.produtoId,
        titulo: body.titulo,
        plataforma: body.plataforma,
        pixelId: body.pixelId,
        tokenAPI: body.tokenAPI || null,
        eventoCheckout: body.eventoCheckout || false,
        eventoCompra: body.eventoCompra || false,
        eventoPAD: body.eventoPAD || false,
        condicaoPix: body.condicaoPix || false,
        condicaoBoleto: body.condicaoBoleto || false,
        condicaoPAD: body.condicaoPAD || false,
        condicaoPagamentoAprovado: body.condicaoPagamentoAprovado || false,
        status: 'ATIVO'
      }
    });

    return NextResponse.json({ pixel }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar pixel:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pixel', details: error.message },
      { status: 500 }
    );
  }
}