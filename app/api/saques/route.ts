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

    // Buscar vendas aprovadas
    const vendasAprovadas = await prisma.carteira.findMany({
      where: { 
        usuarioId: userId,
        status: 'APROVADO',
        tipo: { in: ['VENDA', 'VENDA_PAD'] }
      }
    });

    const saldoVendas = vendasAprovadas.reduce((acc, item) => acc + item.valor, 0);

    // Buscar saques já aprovados
    const saquesAprovados = await prisma.saque.findMany({
      where: { 
        userId,
        status: { in: ['APROVADO', 'PROCESSANDO', 'PENDENTE'] }
      }
    });

    const totalSaques = saquesAprovados.reduce((acc, s) => acc + s.valor, 0);
    const saldoDisponivel = saldoVendas - totalSaques;

    console.log('💰 Vendas aprovadas:', saldoVendas);
    console.log('💸 Saques aprovados:', totalSaques);
    console.log('✅ Saldo disponível:', saldoDisponivel);
    console.log('💵 Valor solicitado:', valor);

    if (valor > saldoDisponivel) {
      console.log('❌ SALDO INSUFICIENTE!');
      return NextResponse.json({ 
        error: 'Saldo insuficiente',
        saldoDisponivel: saldoDisponivel,
        valorSolicitado: valor
      }, { status: 400 });
    }

    const saque = await prisma.saque.create({
      data: {
        userId,
        contaBancariaId,
        valor,
        status: 'PENDENTE'
      }
    });

    console.log('✅ Saque criado:', saque.id);

    return NextResponse.json({ success: true, saque });
  } catch (error) {
    console.error('❌ Erro ao solicitar saque:', error);
    return NextResponse.json({ error: 'Erro ao solicitar saque' }, { status: 500 });
  }
}