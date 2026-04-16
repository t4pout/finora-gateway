import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura-2026-finora';

function getUserId(req: NextRequest): string | null {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return null;
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const integracao = await prisma.integracaoAnuncio.findFirst({
    where: { userId, plataforma: 'META', ativo: true }
  });

  if (!integracao) return NextResponse.json({ error: 'Meta nao conectado' }, { status: 404 });

  try {
    const res = await fetch(
      'https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status,currency&access_token=' + integracao.accessToken
    );
    const data = await res.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });
    return NextResponse.json({ contas: data.data || [] });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao buscar contas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const { accountId, accountNome } = await req.json();

  await prisma.integracaoAnuncio.updateMany({
    where: { userId, plataforma: 'META' },
    data: { accountId, accountNome }
  });

  return NextResponse.json({ ok: true });
}