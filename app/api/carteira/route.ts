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

    // Buscar transações da Carteira
const transacoesLiberadas = await prisma.carteira.findMany({
  where: { 
    usuarioId: userId,
    status: { in: ['LIBERADO', 'APROVADO'] }
  }
});

const transacoesPendentes = await prisma.carteira.findMany({
  where: { 
    usuarioId: userId,
    status: 'PENDENTE'
  }
});

// Calcular saldos
const saldoLiberado = transacoesLiberadas.reduce((acc, t) => acc + t.valor, 0);
const saldoPendente = transacoesPendentes.reduce((acc, t) => acc + t.valor, 0);

    // Buscar saques aprovados para descontar
    const saques = await prisma.saque.findMany({
      where: { 
        userId,
        status: { in: ['APROVADO', 'PROCESSANDO'] }
      }
    });

    const totalSaques = saques.reduce((acc, s) => acc + s.valor, 0);
    const saldoDisponivel = saldoLiberado - totalSaques;

    return NextResponse.json({
      saldoLiberado: saldoDisponivel,
      saldoPendente,
      transacoes
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar carteira' }, { status: 500 });
  }
}


