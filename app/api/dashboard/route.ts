import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'finora-secret-super-seguro-2026-production';
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Calcular data inicial baseada no período
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'hoje';
    let dataInicio = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    
    if (periodo === 'hoje') {
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === '7d') {
      dataInicio.setDate(dataInicio.getDate() - 7);
    } else if (periodo === '14d') {
      dataInicio.setDate(dataInicio.getDate() - 14);
    } else if (periodo === '30d') {
      dataInicio.setDate(dataInicio.getDate() - 30);
    }

    // Buscar TODAS as vendas do usuário no período
    const todasVendas = await prisma.venda.findMany({
      where: {
        vendedorId: decoded.userId,
        createdAt: {
          gte: dataInicio
        }
      }
    });

    // Separar vendas pagas
    const vendasPagas = todasVendas.filter(v => v.status === 'PAGO');

    // Buscar produtos ativos
    const produtosAtivos = await prisma.produto.count({
      where: {
        userId: decoded.userId,
        status: 'ATIVO'
      }
    });

    // Buscar afiliados ativos
    const afiliadosAtivos = await prisma.afiliacao.count({
      where: {
        afiliadoId: decoded.userId,
        status: 'ATIVO'
      }
    });

    // Buscar saldo na carteira
    const carteiras = await prisma.carteira.findMany({
      where: {
        usuarioId: decoded.userId,
        status: 'APROVADO'
      }
    });
    const saldo = carteiras.reduce((acc, c) => acc + c.valor, 0);

    // Calcular formas de pagamento (TODAS as vendas)
    const vendasPorMetodo = todasVendas.reduce((acc, venda) => {
      const metodo = venda.metodoPagamento;
      if (!acc[metodo]) {
        acc[metodo] = { count: 0, total: 0, pagas: 0 };
      }
      acc[metodo].count++;
      acc[metodo].total += venda.valor;
      if (venda.status === 'PAGO') {
        acc[metodo].pagas++;
      }
      return acc;
    }, {} as Record<string, { count: number; total: number; pagas: number }>);

    // Calcular taxas de aprovação
    const calcularTaxa = (metodo: string) => {
      const dados = vendasPorMetodo[metodo];
      if (!dados || dados.count === 0) return 0;
      return Math.round((dados.pagas / dados.count) * 100);
    };

    return NextResponse.json({
      saldo: Number(saldo.toFixed(2)),
      totalVendas: todasVendas.length,
      produtosAtivos,
      afiliadosAtivos,
      formasPagamento: {
        cartao: vendasPorMetodo['CARTAO'] || { count: 0, total: 0 },
        pix: vendasPorMetodo['PIX'] || { count: 0, total: 0 },
        boleto: vendasPorMetodo['BOLETO'] || { count: 0, total: 0 }
      },
      taxasAprovacao: {
        cartao: calcularTaxa('CARTAO'),
        pix: calcularTaxa('PIX'),
        boleto: calcularTaxa('BOLETO')
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados', details: String(error) },
      { status: 500 }
    );
  }
}