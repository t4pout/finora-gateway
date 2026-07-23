import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

function verificarToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) { return null; }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = verificarToken(request);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await context.params;
  const { nome, prazoDias, ativo } = await request.json();
  const tipo = await prisma.tipoEnvio.update({
    where: { id },
    data: { nome, prazoDias: prazoDias ? parseInt(prazoDias) : undefined, ativo }
  });
  return NextResponse.json(tipo);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = verificarToken(request);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await context.params;
  await prisma.tipoEnvio.delete({ where: { id } });
  return NextResponse.json({ success: true });
}