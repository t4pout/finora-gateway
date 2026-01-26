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

    // Verificar se o pedido existe e pertence ao vendedor
    const pedido = await prisma.pedidoPAD.findUnique({
      where: { id },
      select: { vendedorId: true, status: true }
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (pedido.vendedorId !== userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    if (pedido.status !== 'EM_ANALISE') {
      return NextResponse.json(
        { error: 'Apenas pedidos em análise podem ser aprovados' },
        { status: 400 }
      );
    }

    // Aprovar pedido
    const pedidoAtualizado = await prisma.pedidoPAD.update({
      where: { id },
      data: {
        status: 'APROVADO'
      }
    });

    console.log('✅ Pedido aprovado:', pedidoAtualizado.hash);

    return NextResponse.json({
      success: true,
      pedido: pedidoAtualizado
    });

  } catch (error) {
    console.error('Erro ao aprovar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao aprovar pedido' },
      { status: 500 }
    );
  }
}