import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura-2026-finora';

function getUserId(req: NextRequest): string | null {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return null;
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  try {
    const integracao = await prisma.integracaoAnuncio.findFirst({
      where: { userId, plataforma: 'META', ativo: true }
    });

    if (!integracao) return NextResponse.json({ erro: 'Meta Ads nao conectado' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const dias = searchParams.get('dias') || '30';
    const dataFim = new Date().toISOString().split('T')[0];
    const dataInicio = new Date(Date.now() - parseInt(dias) * 86400000).toISOString().split('T')[0];

    const accountId = integracao.accountId;
    const token = integracao.accessToken;

    const res = await fetch(
      'https://graph.facebook.com/v19.0/' + accountId + '/campaigns?' +
      'fields=id,name,status,insights{spend,campaign_name}&' +
      'time_range={"since":"' + dataInicio + '","until":"' + dataFim + '"}&' +
      'access_token=' + token
    );

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ erro: 'Token expirado ou sem permissao', detalhe: data.error.message }, { status: 400 });
    }

    const campanhas = (data.data || []).map((c: any) => ({
      id: c.id,
      nome: c.name,
      status: c.status,
      gasto: parseFloat(c.insights?.data?.[0]?.spend || '0')
    }));

    return NextResponse.json({ campanhas, accountNome: integracao.accountNome });
  } catch (error) {
    console.error('Erro buscar dados Meta:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  await prisma.integracaoAnuncio.updateMany({
    where: { userId, plataforma: 'META' },
    data: { ativo: false }
  });

  return NextResponse.json({ ok: true });
}