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

export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { hash, motivo } = body;

    if (!hash) {
      return NextResponse.json({ error: 'Hash não fornecido' }, { status: 400 });
    }

    if (!motivo) {
      return NextResponse.json({ error: 'Motivo não fornecido' }, { status: 400 });
    }

    // Buscar pedido pelo hash
    const pedido = await prisma.pedidoPAD.findUnique({
      where: { hash }
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (pedido.vendedorId !== userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Cancelar pedido
    const pedidoAtualizado = await prisma.pedidoPAD.update({
      where: { hash },
      data: { 
        status: 'CANCELADO',
        motivo: motivo
      }
    });

    console.log('❌ Pedido cancelado:', pedidoAtualizado.hash, 'Motivo:', motivo);

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