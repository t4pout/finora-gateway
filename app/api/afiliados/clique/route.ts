import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { codigo } = await request.json();

    if (!codigo) {
      return NextResponse.json({ error: 'Código não fornecido' }, { status: 400 });
    }

    const afiliacao = await prisma.afiliacao.findUnique({
      where: { codigo }
    });

    if (!afiliacao) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 });
    }

    await prisma.afiliacao.update({
      where: { codigo },
      data: {
        cliques: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar clique:', error);
    return NextResponse.json({ error: 'Erro' }, { status: 500 });
  }
}
