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
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    // Datas
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioMesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    const inicio30dias = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Vendas totais pagas
    const [
      vendasPagas,
      vendasPagasMes,
      vendasPagasMesPassado,
      vendasPendentes,
      vendasCanceladas,
      totalVendas,
      vendasPorMetodo,
      topVendedores,
      topProdutos,
      saquesPendentes,
      saquesAprovados,
      totalUsuarios,
      usuariosNovosHoje,
      vendasUltimos30dias
    ] = await Promise.all([
      // Receita bruta total
      prisma.venda.aggregate({
        where: { status: 'PAGO' },
        _sum: { valor: true },
        _count: true
      }),
      // Receita mês atual
      prisma.venda.aggregate({
        where: { status: 'PAGO', createdAt: { gte: inicioMes } },
        _sum: { valor: true },
        _count: true
      }),
      // Receita mês passado
      prisma.venda.aggregate({
        where: { status: 'PAGO', createdAt: { gte: inicioMesPassado, lte: fimMesPassado } },
        _sum: { valor: true },
        _count: true
      }),
      // Vendas pendentes
      prisma.venda.aggregate({
        where: { status: 'PENDENTE' },
        _sum: { valor: true },
        _count: true
      }),
      // Vendas canceladas
      prisma.venda.count({ where: { status: 'CANCELADO' } }),
      // Total vendas
      prisma.venda.count(),
      // Por método de pagamento
      prisma.venda.groupBy({
        by: ['metodoPagamento'],
        where: { status: 'PAGO' },
        _sum: { valor: true },
        _count: true
      }),
      // Top 5 vendedores
      prisma.user.findMany({
        where: { role: 'VENDEDOR' },
        select: {
          id: true,
          nome: true,
          email: true,
          vendas: {
            where: { status: 'PAGO' },
            select: { valor: true }
          }
        },
        take: 20
      }),
      // Top 5 produtos
      prisma.produto.findMany({
        select: {
          id: true,
          nome: true,
          vendas: {
            where: { status: 'PAGO' },
            select: { valor: true }
          }
        },
        take: 20
      }),
      // Saques pendentes
      prisma.saque.aggregate({
        where: { status: 'PENDENTE' },
        _sum: { valor: true },
        _count: true
      }),
      // Saques aprovados
      prisma.saque.aggregate({
        where: { status: { in: ['APROVADO', 'PROCESSANDO'] } },
        _sum: { valor: true }
      }),
      // Total usuários
      prisma.user.count({ where: { role: 'VENDEDOR' } }),
      // Novos hoje
      prisma.user.count({
        where: {
          role: 'VENDEDOR',
          createdAt: { gte: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) }
        }
      }),
      // Vendas últimos 30 dias agrupadas por dia
      prisma.venda.findMany({
        where: { status: 'PAGO', createdAt: { gte: inicio30dias } },
        select: { valor: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    // Calcular receita líquida da plataforma (taxas arrecadadas)
    // Receita líquida = Receita Bruta - Saldo dos vendedores (carteira aprovada)
    const carteiraTotal = await prisma.carteira.aggregate({
      where: { status: 'APROVADO', tipo: { in: ['VENDA', 'VENDA_PAD'] } },
      _sum: { valor: true }
    });

    const receitaBruta = vendasPagas._sum.valor || 0;
    const totalCarteira = carteiraTotal._sum.valor || 0;
    const receitaLiquida = receitaBruta - totalCarteira;

    // Receita líquida do mês
    const carteirasMes = await prisma.carteira.aggregate({
      where: {
        status: 'APROVADO',
        tipo: { in: ['VENDA', 'VENDA_PAD'] },
        createdAt: { gte: inicioMes }
      },
      _sum: { valor: true }
    });
    const receitaBrutaMes = vendasPagasMes._sum.valor || 0;
    const receitaLiquidaMes = receitaBrutaMes - (carteirasMes._sum.valor || 0);

    // Ticket médio
    const ticketMedio = vendasPagas._count > 0 ? receitaBruta / vendasPagas._count : 0;

    // Taxa de conversão
    const taxaConversao = totalVendas > 0 ? (vendasPagas._count / totalVendas) * 100 : 0;

    // Top vendedores ordenados
    const topVendedoresOrdenados = topVendedores
      .map(v => ({
        id: v.id,
        nome: v.nome,
        email: v.email,
        totalVendas: v.vendas.length,
        totalVolume: v.vendas.reduce((acc, venda) => acc + venda.valor, 0)
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 5);

    // Top produtos ordenados
    const topProdutosOrdenados = topProdutos
      .map(p => ({
        id: p.id,
        nome: p.nome,
        totalVendas: p.vendas.length,
        totalVolume: p.vendas.reduce((acc, venda) => acc + venda.valor, 0)
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 5);

    // Gráfico últimos 30 dias
    const grafico30dias: { data: string; valor: number; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const dia = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000);
      const diaStr = dia.toISOString().split('T')[0];
      const vendasDia = vendasUltimos30dias.filter(v =>
        v.createdAt.toISOString().split('T')[0] === diaStr
      );
      grafico30dias.push({
        data: diaStr,
        valor: vendasDia.reduce((acc, v) => acc + v.valor, 0),
        count: vendasDia.length
      });
    }

    // Variação mês vs mês passado
    const variacaoMes = vendasPagasMesPassado._sum.valor && vendasPagasMesPassado._sum.valor > 0
      ? ((receitaBrutaMes - (vendasPagasMesPassado._sum.valor || 0)) / (vendasPagasMesPassado._sum.valor || 1)) * 100
      : 0;

    return NextResponse.json({
      receitaBruta,
      receitaLiquida,
      receitaBrutaMes,
      receitaLiquidaMes,
      variacaoMes,
      ticketMedio,
      taxaConversao,
      vendasPagas: { total: vendasPagas._count, valor: receitaBruta },
      vendasPendentes: { total: vendasPendentes._count, valor: vendasPendentes._sum.valor || 0 },
      vendasCanceladas,
      totalVendas,
      vendasPorMetodo,
      topVendedores: topVendedoresOrdenados,
      topProdutos: topProdutosOrdenados,
      saquesPendentes: { total: saquesPendentes._count, valor: saquesPendentes._sum.valor || 0 },
      saquesAprovados: saquesAprovados._sum.valor || 0,
      totalUsuarios,
      usuariosNovosHoje,
      grafico30dias
    });
  } catch (error) {
    console.error('Erro ao buscar receita:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}