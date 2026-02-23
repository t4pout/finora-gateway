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
  } catch { return null; }
}

function calcularTaxa(valor: number, metodo: string, plano: any): { taxaValor: number; taxaPercentual: number; taxaFixo: number } {
  if (!plano) return { taxaValor: 0, taxaPercentual: 0, taxaFixo: 0 };
  let percentual = 0;
  let fixo = 0;
  const m = metodo?.toUpperCase();
  if (m === 'PIX') { percentual = plano.pixPercentual || 0; fixo = plano.pixFixo || 0; }
  else if (m === 'CARTAO') { percentual = plano.cartaoPercentual || 0; fixo = plano.cartaoFixo || 0; }
  else if (m === 'BOLETO') { percentual = plano.boletoPercentual || 0; fixo = plano.boletoFixo || 0; }
  const taxaValor = (valor * percentual / 100) + fixo;
  return { taxaValor, taxaPercentual: percentual, taxaFixo: fixo };
}

export async function GET(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const porPagina = 25;

    // Filtro de data para o resumo
    const filtroData: any = {};
    if (dataInicio) filtroData.gte = new Date(dataInicio + 'T00:00:00');
    if (dataFim) filtroData.lte = new Date(dataFim + 'T23:59:59');

    const whereResumo = {
      status: 'PAGO',
      ...(Object.keys(filtroData).length > 0 ? { createdAt: filtroData } : {})
    };

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioMesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    const inicio30dias = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Buscar todas as vendas pagas com plano de taxa do vendedor (para o período filtrado)
    const [
      vendasPagasFiltro,
      vendasPagasMes,
      vendasPagasMesPassado,
      vendasPendentes,
      vendasCanceladas,
      totalVendas,
      vendasPorMetodo,
      topVendedoresRaw,
      topProdutos,
      saquesPendentes,
      saquesAprovados,
      totalUsuarios,
      usuariosNovosHoje,
      vendasUltimos30dias,
      // Transações paginadas (sempre geral, sem filtro de data)
      totalTransacoes,
      transacoesPaginadas
    ] = await Promise.all([
      // Vendas pagas no período filtrado com plano de taxa
      prisma.venda.findMany({
        where: whereResumo,
        select: {
          id: true,
          valor: true,
          metodoPagamento: true,
          vendedor: {
            select: { planoTaxa: true }
          }
        }
      }),
      // Mês atual
      prisma.venda.findMany({
        where: { status: 'PAGO', createdAt: { gte: inicioMes } },
        select: { valor: true, metodoPagamento: true, vendedor: { select: { planoTaxa: true } } }
      }),
      // Mês passado
      prisma.venda.aggregate({
        where: { status: 'PAGO', createdAt: { gte: inicioMesPassado, lte: fimMesPassado } },
        _sum: { valor: true }, _count: true
      }),
      // Pendentes
      prisma.venda.aggregate({
        where: { status: 'PENDENTE', ...(Object.keys(filtroData).length > 0 ? { createdAt: filtroData } : {}) },
        _sum: { valor: true }, _count: true
      }),
      // Canceladas
      prisma.venda.count({
        where: { status: 'CANCELADO', ...(Object.keys(filtroData).length > 0 ? { createdAt: filtroData } : {}) }
      }),
      // Total vendas no período
      prisma.venda.count({
        where: Object.keys(filtroData).length > 0 ? { createdAt: filtroData } : {}
      }),
      // Por método
      prisma.venda.groupBy({
        by: ['metodoPagamento'],
        where: whereResumo,
        _sum: { valor: true }, _count: true
      }),
      // Top vendedores
      prisma.user.findMany({
        where: { role: 'VENDEDOR' },
        select: {
          id: true, nome: true, email: true,
          planoTaxa: true,
          vendas: {
            where: whereResumo,
            select: { valor: true, metodoPagamento: true }
          }
        }
      }),
      // Top produtos
      prisma.produto.findMany({
        select: {
          id: true, nome: true,
          vendas: { where: whereResumo, select: { valor: true } }
        }
      }),
      // Saques pendentes
      prisma.saque.aggregate({ where: { status: 'PENDENTE' }, _sum: { valor: true }, _count: true }),
      // Saques aprovados
      prisma.saque.aggregate({ where: { status: { in: ['APROVADO', 'PROCESSANDO'] } }, _sum: { valor: true } }),
      // Usuários
      prisma.user.count({ where: { role: 'VENDEDOR' } }),
      // Novos hoje
      prisma.user.count({
        where: {
          role: 'VENDEDOR',
          createdAt: { gte: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) }
        }
      }),
      // Gráfico 30 dias
      prisma.venda.findMany({
        where: { status: 'PAGO', createdAt: { gte: inicio30dias } },
        select: { valor: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
      }),
      // Total transações (sem filtro de data)
      prisma.venda.count(),
      // Transações paginadas (sem filtro de data)
      prisma.venda.findMany({
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          valor: true,
          status: true,
          metodoPagamento: true,
          compradorNome: true,
          nomePlano: true,
          createdAt: true,
          vendedor: {
            select: { nome: true, planoTaxa: true }
          }
        }
      })
    ]);

    // Calcular receita líquida correta aplicando taxa de cada venda
    const calcularReceitaLiquida = (vendas: any[]) => {
      return vendas.reduce((acc, v) => {
        const { taxaValor } = calcularTaxa(v.valor, v.metodoPagamento, v.vendedor?.planoTaxa);
        return acc + taxaValor;
      }, 0);
    };

    const receitaBruta = vendasPagasFiltro.reduce((acc, v) => acc + v.valor, 0);
    const receitaLiquida = calcularReceitaLiquida(vendasPagasFiltro);
    const receitaBrutaMes = vendasPagasMes.reduce((acc, v) => acc + v.valor, 0);
    const receitaLiquidaMes = calcularReceitaLiquida(vendasPagasMes);

    const vendasPagasCount = vendasPagasFiltro.length;
    const ticketMedio = vendasPagasCount > 0 ? receitaBruta / vendasPagasCount : 0;
    const taxaConversao = totalVendas > 0 ? (vendasPagasCount / totalVendas) * 100 : 0;

    const variacaoMes = vendasPagasMesPassado._sum.valor && vendasPagasMesPassado._sum.valor > 0
      ? ((receitaBrutaMes - (vendasPagasMesPassado._sum.valor || 0)) / (vendasPagasMesPassado._sum.valor || 1)) * 100
      : 0;

    // Top vendedores com taxa correta
    const topVendedores = topVendedoresRaw
      .map(v => ({
        id: v.id,
        nome: v.nome,
        email: v.email,
        totalVendas: v.vendas.length,
        totalVolume: v.vendas.reduce((acc, venda) => acc + venda.valor, 0),
        totalTaxas: v.vendas.reduce((acc, venda) => {
          const { taxaValor } = calcularTaxa(venda.valor, venda.metodoPagamento, v.planoTaxa);
          return acc + taxaValor;
        }, 0)
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 5);

    // Top produtos
    const topProdutosOrdenados = topProdutos
      .map(p => ({
        id: p.id,
        nome: p.nome,
        totalVendas: p.vendas.length,
        totalVolume: p.vendas.reduce((acc, v) => acc + v.valor, 0)
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 5);

    // Gráfico 30 dias
    const grafico30dias = [];
    for (let i = 29; i >= 0; i--) {
      const dia = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000);
      const diaStr = dia.toISOString().split('T')[0];
      const vendasDia = vendasUltimos30dias.filter(v => v.createdAt.toISOString().split('T')[0] === diaStr);
      grafico30dias.push({
        data: diaStr,
        valor: vendasDia.reduce((acc, v) => acc + v.valor, 0),
        count: vendasDia.length
      });
    }

    // Montar lista de transações com taxa calculada
    const transacoes = transacoesPaginadas.map(v => {
      const { taxaValor, taxaPercentual, taxaFixo } = calcularTaxa(
        v.valor, v.metodoPagamento, v.vendedor?.planoTaxa
      );
      return {
        id: v.id,
        valor: v.valor,
        valorLiquido: v.valor - taxaValor,
        taxaValor,
        taxaPercentual,
        taxaFixo,
        status: v.status,
        metodoPagamento: v.metodoPagamento,
        compradorNome: v.compradorNome,
        nomePlano: v.nomePlano,
        vendedorNome: v.vendedor?.nome || 'N/A',
        planoTaxaNome: v.vendedor?.planoTaxa?.nome || 'Sem plano',
        createdAt: v.createdAt
      };
    });

    return NextResponse.json({
      // Resumo (filtrado por data se informado)
      receitaBruta,
      receitaLiquida,
      receitaBrutaMes,
      receitaLiquidaMes,
      variacaoMes,
      ticketMedio,
      taxaConversao,
      vendasPagas: { total: vendasPagasCount, valor: receitaBruta },
      vendasPendentes: { total: vendasPendentes._count, valor: vendasPendentes._sum.valor || 0 },
      vendasCanceladas,
      totalVendas,
      vendasPorMetodo,
      topVendedores,
      topProdutos: topProdutosOrdenados,
      saquesPendentes: { total: saquesPendentes._count, valor: saquesPendentes._sum.valor || 0 },
      saquesAprovados: saquesAprovados._sum.valor || 0,
      totalUsuarios,
      usuariosNovosHoje,
      grafico30dias,
      // Transações (sempre geral, paginado)
      transacoes,
      transacoesPaginacao: {
        total: totalTransacoes,
        pagina,
        porPagina,
        totalPaginas: Math.ceil(totalTransacoes / porPagina)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar receita:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}