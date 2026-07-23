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

export async function GET(request: NextRequest) {
  const userId = verificarToken(request);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const tipos = await prisma.tipoEnvio.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(tipos);
}

export async function POST(request: NextRequest) {
  const userId = verificarToken(request);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { nome, prazoDias } = await request.json();
  if (!nome || !prazoDias) return NextResponse.json({ error: 'Nome e prazo são obrigatórios' }, { status: 400 });
  const tipo = await prisma.tipoEnvio.create({ data: { userId, nome, prazoDias: parseInt(prazoDias), ativo: true } });
  return NextResponse.json(tipo);
}