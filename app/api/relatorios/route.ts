import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

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

    const { searchParams } = new URL(request.url);
    const periodo = parseInt(searchParams.get('periodo') || '30');

    // Data inicial
    const dataInicial = new Date();
    dataInicial.setDate(dataInicial.getDate() - periodo);

    // Vendas por dia
    const vendas = await prisma.venda.findMany({
      where: {
        vendedorId: userId,
        status: 'APROVADA',
        createdAt: {
          gte: dataInicial
        }
      },
      select: {
        valor: true,
        createdAt: true
      }
    });

    // Agrupar vendas por dia
    const vendasPorDia: { [key: string]: { total: number; quantidade: number } } = {};
    vendas.forEach(venda => {
      const data = venda.createdAt.toISOString().split('T')[0];
      if (!vendasPorDia[data]) {
        vendasPorDia[data] = { total: 0, quantidade: 0 };
      }
      vendasPorDia[data].total += venda.valor;
      vendasPorDia[data].quantidade += 1;
    });

    const vendasPorDiaArray = Object.entries(vendasPorDia).map(([data, info]) => ({
      data,
      total: info.total,
      quantidade: info.quantidade
    })).sort((a, b) => a.data.localeCompare(b.data));

    // Produtos mais vendidos
    const produtosMaisVendidos = await prisma.venda.groupBy({
      by: ['produtoId'],
      where: {
        vendedorId: userId,
        status: 'APROVADA',
        createdAt: {
          gte: dataInicial
        }
      },
      _count: {
        id: true
      },
      _sum: {
        valor: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    const produtosComNomes = await Promise.all(
      produtosMaisVendidos.map(async (item) => {
        const produto = await prisma.produto.findUnique({
          where: { id: item.produtoId },
          select: { nome: true }
        });
        return {
          nome: produto?.nome || 'Produto Desconhecido',
          vendas: item._count.id,
          receita: item._sum.valor || 0
        };
      })
    );

    // Top campanhas
    const campanhasTop = await prisma.campanha.findMany({
      where: {
        userId,
        cliques: {
          gt: 0
        }
      },
      select: {
        nome: true,
        cliques: true,
        conversoes: true
      },
      orderBy: {
        conversoes: 'desc'
      },
      take: 5
    });

    // Totais
    const receitaTotal = vendas.reduce((acc, v) => acc + v.valor, 0);
    const vendasTotal = vendas.length;
    const ticketMedio = vendasTotal > 0 ? receitaTotal / vendasTotal : 0;

    return NextResponse.json({
      vendasPorDia: vendasPorDiaArray,
      produtosMaisVendidos: produtosComNomes,
      campanhasTop,
      totais: {
        receitaTotal,
        vendasTotal,
        ticketMedio
      }
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar relatórios' }, { status: 500 });
  }
}
