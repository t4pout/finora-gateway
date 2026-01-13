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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
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
      prazoBoletoDias,
      ativo
    } = await request.json();

    const plano = await prisma.planoTaxa.update({
      where: { id },
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
        prazoBoletoDias: parseInt(prazoBoletoDias) || 7,
        ativo
      }
    });

    return NextResponse.json({ success: true, plano });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar plano' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    await prisma.planoTaxa.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao excluir plano' }, { status: 500 });
  }
}
