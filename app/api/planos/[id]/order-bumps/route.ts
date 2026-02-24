import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: planoId } = await context.params;
    const plano = await prisma.planoOferta.findUnique({
      where: { id: planoId },
      include: { orderBumps: { include: { orderBump: true } } }
    });
    const orderBumpIds = plano?.orderBumps.map((ob: any) => ob.orderBumpId) || [];
    return NextResponse.json({ orderBumpIds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: planoId } = await context.params;
    const { orderBumpIds } = await request.json();

    await prisma.planoOrderBump.deleteMany({ where: { planoId } });

    if (orderBumpIds && orderBumpIds.length > 0) {
      await prisma.planoOrderBump.createMany({
        data: orderBumpIds.map((orderBumpId: string) => ({ planoId, orderBumpId }))
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}