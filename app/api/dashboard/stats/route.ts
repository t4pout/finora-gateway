import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    if (!dataInicio || !dataFim) {
      return NextResponse.json({ error: 'Datas são obrigatórias' }, { status: 400 });
    }

    // Converter para Date com horário
    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    // Buscar pedidos PAD no período
    const pedidosPAD = await prisma.pedidoPAD.findMany({
      where: {
        vendedorId: userId,
        createdAt: {
          gte: inicio,
          lte: fim
        }
      }
    });

    // Calcular estatísticas
    const stats = {
      pedidosGerados: {
        count: pedidosPAD.length,
        valor: pedidosPAD.reduce((sum, p) => sum + p.valor, 0)
      },
      padAprovado: {
        count: pedidosPAD.filter(p => p.status === 'APROVADO' && !p.vendaId).length,
        valor: pedidosPAD.filter(p => p.status === 'APROVADO' && !p.vendaId).reduce((sum, p) => sum + p.valor, 0)
      },
      aguardandoEnvio: {
        count: pedidosPAD.filter(p => p.vendaId && !p.codigoRastreio).length,
        valor: pedidosPAD.filter(p => p.vendaId && !p.codigoRastreio).reduce((sum, p) => sum + p.valor, 0)
      },
      entregue: {
        count: 0,
        valor: 0
      },
      cancelados: {
        count: pedidosPAD.filter(p => p.status === 'CANCELADO').length,
        valor: pedidosPAD.filter(p => p.status === 'CANCELADO').reduce((sum, p) => sum + p.valor, 0)
      },
      saldo: 0,
      produtosAtivos: await prisma.produto.count({
        where: { userId, status: 'ATIVO' }
      })
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas', details: error.message },
      { status: 500 }
    );
  }
}