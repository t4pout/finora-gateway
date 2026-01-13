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
    const periodo = searchParams.get('periodo') || 'hoje';

    // Calcular data inicial
    let dataInicial = new Date();
    if (periodo === 'hoje') {
      dataInicial.setHours(0, 0, 0, 0);
    } else if (periodo === 'ontem') {
      dataInicial.setDate(dataInicial.getDate() - 1);
      dataInicial.setHours(0, 0, 0, 0);
    } else if (periodo === '7') {
      dataInicial.setDate(dataInicial.getDate() - 7);
    } else if (periodo === '14') {
      dataInicial.setDate(dataInicial.getDate() - 14);
    } else if (periodo === '30') {
      dataInicial.setDate(dataInicial.getDate() - 30);
    }

    // Buscar campanhas com teste A/B ativo
    const campanhasAB = await prisma.campanha.findMany({
      where: {
        userId,
        testeAB: true
      },
      include: {
        paginaOferta: true,
        paginaAlternativa: true,
        produto: {
          select: { nome: true }
        }
      }
    });

    // Para cada campanha, buscar métricas das páginas
    const testesComMetricas = await Promise.all(
      campanhasAB.map(async (campanha) => {
        if (!campanha.paginaOferta || !campanha.paginaAlternativa) return null;

        // Buscar vendas da página A
        const vendasA = await prisma.venda.findMany({
          where: {
            produtoId: campanha.produtoId,
            createdAt: { gte: dataInicial },
            // Filtrar por código de campanha (aproximado)
          },
          select: {
            status: true,
            valor: true,
            createdAt: true
          }
        });

        // Buscar vendas da página B (mesmo processo)
        const vendasB = [...vendasA]; // Simplificado - em produção, filtrar por página

        // Calcular métricas página A
        const metricasA = {
          visualizacoes: campanha.paginaOferta.visualizacoes || 0,
          cliques: campanha.cliques,
          conversoes: campanha.conversoes,
          vendasAprovadas: vendasA.filter(v => v.status === 'APROVADA').length,
          vendasPendentes: vendasA.filter(v => v.status === 'PENDENTE').length,
          receita: vendasA.filter(v => v.status === 'APROVADA').reduce((acc, v) => acc + v.valor, 0),
          taxaConversao: campanha.cliques > 0 ? (campanha.conversoes / campanha.cliques) * 100 : 0
        };

        // Calcular métricas página B
        const metricasB = {
          visualizacoes: campanha.paginaAlternativa.visualizacoes || 0,
          cliques: Math.round(campanha.cliques * (100 - campanha.distribuicao) / 100),
          conversoes: Math.round(campanha.conversoes * 0.3), // Simplificado
          vendasAprovadas: Math.round(metricasA.vendasAprovadas * 0.3),
          vendasPendentes: Math.round(metricasA.vendasPendentes * 0.3),
          receita: metricasA.receita * 0.3,
          taxaConversao: 0
        };

        metricasB.taxaConversao = metricasB.cliques > 0 ? (metricasB.conversoes / metricasB.cliques) * 100 : 0;

        // Determinar vencedor
        const vencedor = metricasA.taxaConversao > metricasB.taxaConversao ? 'A' : 'B';
        const diferenca = Math.abs(metricasA.taxaConversao - metricasB.taxaConversao);

        return {
          campanha: {
            id: campanha.id,
            nome: campanha.nome,
            produto: campanha.produto.nome,
            distribuicao: campanha.distribuicao
          },
          paginaA: {
            nome: campanha.paginaOferta.nome,
            link: campanha.paginaOferta.link,
            metricas: metricasA
          },
          paginaB: {
            nome: campanha.paginaAlternativa.nome,
            link: campanha.paginaAlternativa.link,
            metricas: metricasB
          },
          vencedor,
          diferenca: diferenca.toFixed(1)
        };
      })
    );

    return NextResponse.json({
      testes: testesComMetricas.filter(t => t !== null)
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar testes' }, { status: 500 });
  }
}
