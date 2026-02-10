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

export async function GET(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    // Montar filtro de data
    const filtroData: any = {};
    if (dataInicio && dataFim) {
      // Criar datas no fuso horário de Brasília
      const inicio = new Date(dataInicio + 'T00:00:00-03:00');
      
      const fim = new Date(dataFim + 'T23:59:59-03:00');

      filtroData.createdAt = {
        gte: inicio,
        lte: fim
      };
    }

    // Buscar pedidos do vendedor
    const pedidos = await prisma.pedidoPAD.findMany({
      where: {
        vendedorId: userId,
        ...filtroData
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ pedidos });
   
  } catch (error) {
    console.error('Erro ao listar pedidos PAD:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}