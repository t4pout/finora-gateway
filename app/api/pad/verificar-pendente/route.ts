import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hash = searchParams.get('hash');
    const cpf = searchParams.get('cpf');

    if (!hash && !cpf) {
      return NextResponse.json(
        { error: 'Hash ou CPF é obrigatório' },
        { status: 400 }
      );
    }

    let pedido;

    if (hash) {
      pedido = await prisma.pedidoPAD.findUnique({
        where: { hash }
      });
    } else if (cpf) {
      // Buscar o pedido mais recente deste CPF
      pedido = await prisma.pedidoPAD.findFirst({
        where: { clienteCpfCnpj: cpf },
        orderBy: { criadoEm: 'desc' }
      });
    }

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Retornar status do pedido
    return NextResponse.json({
      hash: pedido.hash,
      status: pedido.status,
      pixPago: pedido.pixPago,
      pixQrCode: pedido.pixQrCode ? true : false,
      valor: pedido.valor,
      clienteNome: pedido.clienteNome
    });

  } catch (error) {
    console.error('Erro ao verificar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar pedido' },
      { status: 500 }
    );
  }
}