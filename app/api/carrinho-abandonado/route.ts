import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { compradorNome, compradorEmail, compradorTel, compradorCpf, planoId, utmSource, utmMedium, utmCampaign } = body;

    console.log('Carrinho abandonado recebido:', { compradorEmail, planoId, compradorNome });
    if (!compradorEmail || !planoId) {
      console.log('Dados incompletos:', { compradorEmail, planoId });
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const plano = await prisma.planoOferta.findUnique({
      where: { id: planoId },
      include: { produto: { include: { user: true } } }
    });

    if (!plano) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });

    const existente = await prisma.carrinhoAbandonado.findFirst({
      where: { compradorEmail, planoId, status: 'ABANDONADO' }
    });

    if (existente) {
      await prisma.carrinhoAbandonado.update({
        where: { id: existente.id },
        data: { compradorNome, compradorTel, compradorCpf, updatedAt: new Date() }
      });
      return NextResponse.json({ success: true });
    }

    await prisma.carrinhoAbandonado.create({
      data: {
        compradorNome,
        compradorEmail,
        compradorTel,
        compradorCpf,
        produtoId: plano.produtoId,
        produtoNome: plano.produto.nome,
        planoId,
        planoNome: plano.nome,
        valor: plano.preco,
        utmSource,
        utmMedium,
        utmCampaign,
        vendedorId: plano.produto.userId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const verTodos = request.nextUrl.searchParams.get('todos') === 'true';

    const carrinhos = await prisma.carrinhoAbandonado.findMany({
      where: (user.role === 'ADMIN' && verTodos) ? {} : { vendedorId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    return NextResponse.json({ success: true, carrinhos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}