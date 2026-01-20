import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'finora-secret-super-seguro-2026-production';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

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
      { error: 'Erro ao buscar dados' },
      { status: 500 }
    );
  }
}