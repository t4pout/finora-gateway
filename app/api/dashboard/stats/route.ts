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

    // Buscar total de vendas aprovadas
    const vendasAprovadas = await prisma.venda.aggregate({
      where: {
        vendedorId: userId,
        status: 'APROVADA'
      },
      _sum: {
        valor: true
      },
      _count: true
    });

    // Buscar produtos ativos
    const produtosAtivos = await prisma.produto.count({
      where: {
        userId,
        status: 'ATIVO'
      }
    });

    // Buscar links de afiliados ativos
    const afiliadosAtivos = await prisma.afiliacao.count({
      where: {
        afiliadoId: userId,
        status: 'ATIVO'
      }
    });

    return NextResponse.json({
      saldo: vendasAprovadas._sum.valor || 0,
      totalVendas: vendasAprovadas._count || 0,
      produtosAtivos,
      afiliadosAtivos
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
  }
}
