import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

function getUserId(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura') as any;
    return decoded.userId || decoded.id;
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const integracao = await prisma.integracaoBling.findUnique({ where: { userId } });
    return NextResponse.json({ integracao });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { clientId, clientSecret, serieNF, naturezaOperacao, emiteNFAutomatico } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Client ID e Client Secret são obrigatórios' }, { status: 400 });
    }

    const integracao = await prisma.integracaoBling.upsert({
      where: { userId },
      update: { clientId, clientSecret, serieNF: serieNF || '1', naturezaOperacao: naturezaOperacao || 'Venda de mercadoria', emiteNFAutomatico: emiteNFAutomatico ?? true },
      create: { userId, clientId, clientSecret, serieNF: serieNF || '1', naturezaOperacao: naturezaOperacao || 'Venda de mercadoria', emiteNFAutomatico: emiteNFAutomatico ?? true }
    });

    return NextResponse.json({ success: true, integracao });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const data: any = {};
    if (body.ativo !== undefined) data.ativo = body.ativo;
    if (body.emiteNFAutomatico !== undefined) data.emiteNFAutomatico = body.emiteNFAutomatico;
    if (body.serieNF !== undefined) data.serieNF = body.serieNF;
    if (body.naturezaOperacao !== undefined) data.naturezaOperacao = body.naturezaOperacao;
    if (body.accessToken !== undefined) data.accessToken = body.accessToken;
    if (body.refreshToken !== undefined) data.refreshToken = body.refreshToken;
    if (body.tokenExpiresAt !== undefined) data.tokenExpiresAt = body.tokenExpiresAt;

    const integracao = await prisma.integracaoBling.update({ where: { userId }, data });
    return NextResponse.json({ success: true, integracao });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    await prisma.integracaoBling.delete({ where: { userId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}