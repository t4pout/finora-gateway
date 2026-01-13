import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { codigo } = await request.json();

    if (!codigo) {
      return NextResponse.json({ error: 'Código não informado' }, { status: 400 });
    }

    // Incrementar cliques da campanha
    await prisma.campanha.updateMany({
      where: {
        linkCampanha: {
          contains: `camp=${codigo}`
        }
      },
      data: {
        cliques: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao registrar clique' }, { status: 500 });
  }
}
