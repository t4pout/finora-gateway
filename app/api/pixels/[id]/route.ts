import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pixelId } = await context.params;
    const body = await request.json();

    const pixel = await prisma.pixelConversao.update({
      where: { id: pixelId },
      data: {
        titulo: body.titulo,
        plataforma: body.plataforma,
        pixelId: body.pixelId,
        tokenAPI: body.tokenAPI || null,
        eventoCheckout: body.eventoCheckout,
        eventoCompra: body.eventoCompra,
        eventoPAD: body.eventoPAD,
        condicaoPix: body.condicaoPix,
        condicaoBoleto: body.condicaoBoleto,
        condicaoPAD: body.condicaoPAD,
        condicaoPagamentoAprovado: body.condicaoPagamentoAprovado
      }
    });

    return NextResponse.json({ pixel });

  } catch (error: any) {
    console.error('Erro ao atualizar pixel:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pixel', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pixelId } = await context.params;

    await prisma.pixelConversao.delete({
      where: { id: pixelId }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro ao deletar pixel:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar pixel', details: error.message },
      { status: 500 }
    );
  }
}