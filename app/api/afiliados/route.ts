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

function gerarCodigo() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const afiliacoes = await prisma.afiliacao.findMany({
      where: { afiliadoId: userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, afiliacoes });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar afiliações' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { comissao } = await request.json();

    if (!comissao || comissao < 0 || comissao > 100) {
      return NextResponse.json(
        { error: 'Comissão inválida (0-100%)' },
        { status: 400 }
      );
    }

    let codigoUnico = gerarCodigo();
    let existe = await prisma.afiliacao.findUnique({
      where: { codigo: codigoUnico }
    });

    while (existe) {
      codigoUnico = gerarCodigo();
      existe = await prisma.afiliacao.findUnique({
        where: { codigo: codigoUnico }
      });
    }

    const afiliacao = await prisma.afiliacao.create({
      data: {
        afiliadoId: userId,
        codigo: codigoUnico,
        comissao: parseFloat(comissao),
        status: 'ATIVO'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Link de afiliado criado!',
      afiliacao
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao criar link' }, { status: 500 });
  }
}
