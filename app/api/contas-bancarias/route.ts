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

    const contas = await prisma.contaBancaria.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ contas });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar contas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const {
      tipo,
      banco,
      agencia,
      conta,
      tipoConta,
      chavePix,
      tipoChavePix,
      titular,
      cpfCnpj,
      principal
    } = await request.json();

    // Se marcar como principal, desmarcar outras
    if (principal) {
      await prisma.contaBancaria.updateMany({
        where: { userId },
        data: { principal: false }
      });
    }

    const contaBancaria = await prisma.contaBancaria.create({
      data: {
        userId,
        tipo,
        banco,
        agencia,
        conta,
        tipoConta,
        chavePix,
        tipoChavePix,
        titular,
        cpfCnpj,
        principal
      }
    });

    return NextResponse.json({ success: true, conta: contaBancaria });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}
