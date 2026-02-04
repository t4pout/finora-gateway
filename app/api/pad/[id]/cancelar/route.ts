import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'finora-secret-super-seguro-2026-production';

function verificarToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.motivo) {
      return NextResponse.json(
        { error: 'Motivo do cancelamento é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o pedido existe e pertence ao vendedor
    const pedido = await prisma.pedidoPAD.findUnique({
      where: { hash: id },
      select: { vendedorId: true, status: true }
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (pedido.vendedorId !== userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    if (pedido.status === 'PAGO') {
      return NextResponse.json(
        { error: 'Não é possível cancelar pedido já pago' },
        { status: 400 }
      );
    }

    // Cancelar pedido
    const pedidoAtualizado = await prisma.pedidoPAD.update({
      where: { hash: id },
      data: {
        status: 'CANCELADO',
        motivoCancelamento: body.motivo
      }
    });

    console.log('❌ Pedido cancelado:', pedidoAtualizado.hash);

    return NextResponse.json({
      success: true,
      pedido: pedidoAtualizado
    });

  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar pedido' },
      { status: 500 }
    );
  }
}