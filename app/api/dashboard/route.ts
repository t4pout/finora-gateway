import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Ler token do header Authorization
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Decodificar o token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'finora-secret-super-seguro-2026-production';
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Buscar vendas PAGAS do usuário
    const vendas = await prisma.venda.findMany({
      where: {
        vendedorId: decoded.userId,
        status: 'PAGO'
      }
    });

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

    // Calcular formas de pagamento
    const vendasPorMetodo = vendas.reduce((acc, venda) => {
      const metodo = venda.metodoPagamento;
      if (!acc[metodo]) {
        acc[metodo] = { count: 0, total: 0 };
      }
      acc[metodo].count++;
      acc[metodo].total += venda.valor;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    return NextResponse.json({
      saldo: Number(saldo.toFixed(2)),
      totalVendas: vendas.length,
      produtosAtivos,
      afiliadosAtivos,
      formasPagamento: {
        cartao: vendasPorMetodo['CARTAO'] || { count: 0, total: 0 },
        pix: vendasPorMetodo['PIX'] || { count: 0, total: 0 },
        boleto: vendasPorMetodo['BOLETO'] || { count: 0, total: 0 }
      },
      taxasAprovacao: {
        cartao: 0,
        pix: 0,
        boleto: 0
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