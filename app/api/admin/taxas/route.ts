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

    const planos = await prisma.planoTaxa.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ planos });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar planos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const {
      nome,
      descricao,
      pixPercentual,
      pixFixo,
      cartaoPercentual,
      cartaoFixo,
      boletoPercentual,
      boletoFixo,
      prazoPixDias,
      prazoCartaoDias,
      prazoBoletoDias
    } = await request.json();

    const plano = await prisma.planoTaxa.create({
      data: {
        nome,
        descricao,
        pixPercentual: parseFloat(pixPercentual) || 0,
        pixFixo: parseFloat(pixFixo) || 0,
        cartaoPercentual: parseFloat(cartaoPercentual) || 0,
        cartaoFixo: parseFloat(cartaoFixo) || 0,
        boletoPercentual: parseFloat(boletoPercentual) || 0,
        boletoFixo: parseFloat(boletoFixo) || 0,
        prazoPixDias: parseInt(prazoPixDias) || 3,
        prazoCartaoDias: parseInt(prazoCartaoDias) || 30,
        prazoBoletoDias: parseInt(prazoBoletoDias) || 7
      }
    });

    return NextResponse.json({ success: true, plano });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao criar plano' }, { status: 500 });
  }
}
