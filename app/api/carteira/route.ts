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

    // Buscar apenas vendas aprovadas
    const vendasAprovadas = await prisma.carteira.findMany({
      where: { 
        usuarioId: userId,
        status: 'APROVADO',
        tipo: { in: ['VENDA', 'VENDA_PAD'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Buscar vendas pendentes
    const vendasPendentes = await prisma.carteira.findMany({
      where: { 
        usuarioId: userId,
        status: 'PENDENTE',
        tipo: { in: ['VENDA', 'VENDA_PAD'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular saldos
    const saldoLiberado = vendasAprovadas.reduce((acc, t) => acc + t.valor, 0);
    const saldoPendente = vendasPendentes.reduce((acc, t) => acc + t.valor, 0);

    // Buscar saques aprovados
    const saques = await prisma.saque.findMany({
      where: { 
        userId,
        status: { in: ['APROVADO', 'PROCESSANDO'] }
      }
    });

    const totalSaques = saques.reduce((acc, s) => acc + s.valor, 0);
    const saldoDisponivel = saldoLiberado - totalSaques;

    // Combinar todas as transações
    const todasTransacoes = [...vendasAprovadas, ...vendasPendentes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log('💰 Saldo liberado:', saldoLiberado);
    console.log('💸 Total saques:', totalSaques);
    console.log('✅ Saldo disponível:', saldoDisponivel);

    return NextResponse.json({
      saldoLiberado: saldoDisponivel,
      saldoPendente,
      transacoes: todasTransacoes
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar carteira' }, { status: 500 });
  }
}