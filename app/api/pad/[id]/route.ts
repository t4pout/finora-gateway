import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // id é na verdade o hash na URL
    const pedido = await prisma.pedidoPAD.findUnique({
      where: { hash: id }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    console.log(`📦 Pedido encontrado: ${id}`);

    return NextResponse.json({ pedido });

  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedido' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('✏️ Atualizando pedido:', id);

    // Buscar pedido existente
    const pedidoExistente = await prisma.pedidoPAD.findUnique({
      where: { hash: id }
    });

    if (!pedidoExistente) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar apenas campos permitidos
    const pedidoAtualizado = await prisma.pedidoPAD.update({
      where: { hash: id },
      data: {
        clienteNome: body.clienteNome,
        clienteEmail: body.clienteEmail,
        clienteTelefone: body.clienteTelefone,
        clienteCpfCnpj: body.clienteCpfCnpj,
        cep: body.cep,
        rua: body.rua,
        numero: body.numero,
        complemento: body.complemento,
        bairro: body.bairro,
        cidade: body.cidade,
        estado: body.estado,
        observacoes: body.observacoes
      }
    });

    console.log('✅ Pedido atualizado com sucesso');

    return NextResponse.json({
      success: true,
      pedido: pedidoAtualizado
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    );
  }
}