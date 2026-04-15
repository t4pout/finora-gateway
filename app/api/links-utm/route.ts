import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

function getUserIdFromToken(req: NextRequest): string | null {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return null;
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET — listar links do usuário
export async function GET(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  // Verifica se o usuário tem Finora UTM ativo
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { finoraUtmAtivo: true } });
  if (!user?.finoraUtmAtivo) return NextResponse.json({ error: 'Finora UTM não ativado' }, { status: 403 });

  const links = await prisma.linkUTM.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ links });
}

// POST — criar novo link
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { finoraUtmAtivo: true } });
  if (!user?.finoraUtmAtivo) return NextResponse.json({ error: 'Finora UTM não ativado' }, { status: 403 });

  const body = await req.json();
  const { nome, urlDestino, utmSource, utmMedium, utmCampaign, urlFinal, produtoId } = body;

  if (!nome || !urlDestino || !utmSource || !urlFinal) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
  }

  const link = await prisma.linkUTM.create({
    data: { userId, nome, urlDestino, utmSource, utmMedium, utmCampaign, urlFinal, produtoId: produtoId || null }
  });

  return NextResponse.json({ link });
}

// DELETE — remover link
export async function DELETE(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  // Garante que o link pertence ao usuário
  const link = await prisma.linkUTM.findFirst({ where: { id, userId } });
  if (!link) return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 });

  await prisma.linkUTM.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}