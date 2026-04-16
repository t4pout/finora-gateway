import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

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

  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get('periodo') || 'mes';

  let dataInicio = new Date();
  if (periodo === 'mes') dataInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  else if (periodo === '7') dataInicio = new Date(Date.now() - 7 * 86400000);
  else if (periodo === '30') dataInicio = new Date(Date.now() - 30 * 86400000);
  else if (periodo === '90') dataInicio = new Date(Date.now() - 90 * 86400000);

  const despesas = await prisma.despesa.findMany({
    where: { userId, data: { gte: dataInicio } },
    orderBy: { data: 'desc' }
  });

  const total = despesas.reduce((acc, d) => acc + d.valor, 0);
  return NextResponse.json({ despesas, total });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const body = await req.json();
  const { descricao, categoria, valor, data, recorrente } = body;

  if (!descricao || !valor) return NextResponse.json({ error: 'Descricao e valor obrigatorios' }, { status: 400 });

  const despesa = await prisma.despesa.create({
    data: {
      userId, descricao,
      categoria: categoria || 'OUTROS',
      valor: parseFloat(valor),
      data: data ? new Date(data) : new Date(),
      recorrente: recorrente || false
    }
  });

  return NextResponse.json({ despesa });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });

  const despesa = await prisma.despesa.findFirst({ where: { id, userId } });
  if (!despesa) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 });

  await prisma.despesa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}