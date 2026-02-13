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

    const saques = await prisma.saque.findMany({
      where: { userId },
      include: {
        contaBancaria: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ saques });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar saques' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { valor, contaBancariaId } = await request.json();

    // Verificar saldo disponível
    const transacoes = await prisma.transacao.findMany({
      where: { 
        userId,
        status: 'LIBERADO',
        dataLiberacao: { lte: new Date() }
      }
    });

    const saldoLiberado = transacoes.reduce((acc, t) => acc + t.valor, 0);

    const saquesAprovados = await prisma.saque.findMany({
      where: { 
        userId,
        status: { in: ['APROVADO', 'PROCESSANDO'] }
      }
    });

    const totalSaques = saquesAprovados.reduce((acc, s) => acc + s.valor, 0);
    console.log('Saldo liberado:', saldoLiberado);
console.log('Total de saques aprovados:', totalSaques);
console.log('Saldo dispon�vel:', saldoDisponivel);
console.log('Valor do saque solicitado:', valor);

const saldoDisponivel = saldoLiberado - totalSaques;

    if (valor > saldoDisponivel) {
      return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 });
    }

    const saque = await prisma.saque.create({
      data: {
        userId,
        contaBancariaId,
        valor,
        status: 'PENDENTE'
      }
    });

    return NextResponse.json({ success: true, saque });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao solicitar saque' }, { status: 500 });
  }
}

