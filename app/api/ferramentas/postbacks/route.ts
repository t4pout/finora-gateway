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

    const postbacks = await prisma.postback.findMany({
      where: { userId },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ postbacks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { nome, url, metodo, eventos } = body;

    if (!nome || !url) {
      return NextResponse.json({ error: 'Nome e URL são obrigatórios' }, { status: 400 });
    }

    try { new URL(url.split('{')[0]); } catch {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    const postback = await prisma.postback.create({
      data: {
        userId,
        nome,
        url,
        metodo: metodo || 'GET',
        eventos: eventos || ['VENDA_PAGA']
      }
    });

    return NextResponse.json({ success: true, postback });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    await prisma.postback.deleteMany({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, ativo, nome, url, metodo, eventos } = body;
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const data: any = {};
    if (ativo !== undefined) data.ativo = ativo;
    if (nome !== undefined) data.nome = nome;
    if (url !== undefined) data.url = url;
    if (metodo !== undefined) data.metodo = metodo;
    if (eventos !== undefined) data.eventos = eventos;

    await prisma.postback.updateMany({ where: { id, userId }, data });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}