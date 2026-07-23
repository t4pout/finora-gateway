import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: planoId } = await context.params;
    const plano = await prisma.planoOferta.findUnique({
      where: { id: planoId },
      include: { fretes: { include: { opcaoFrete: true } } }
    });
    const opcaoFreteIds = plano?.fretes.map((f: any) => f.opcaoFreteId) || [];
    return NextResponse.json({ opcaoFreteIds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: planoId } = await context.params;
    const { opcaoFreteIds } = await request.json();

    await prisma.planoFrete.deleteMany({ where: { planoId } });

    if (opcaoFreteIds && opcaoFreteIds.length > 0) {
      await prisma.planoFrete.createMany({
        data: opcaoFreteIds.map((opcaoFreteId: string) => ({ planoId, opcaoFreteId }))
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}