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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            produtos: true,
            vendas: true
          }
        },
        planoTaxa: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular saldo de cada usuário somando transações LIBERADO + PENDENTE
    const usersComSaldo = await Promise.all(
      users.map(async (u) => {
        const transacoes = await prisma.carteira.findMany({
          where: {
            usuarioId: u.id,
            status: { in: ['LIBERADO', 'PENDENTE'] }
          },
          select: { valor: true }
        });
        const saldo = transacoes.reduce((acc, t) => acc + t.valor, 0);
        return { ...u, saldo };
      })
    );

    return NextResponse.json({ users: usersComSaldo });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}