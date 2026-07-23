import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const planoId = searchParams.get('planoId');

  if (planoId) {
    const selecionados = await prisma.planoFrete.findMany({
      where: { planoId },
      select: { opcaoFreteId: true }
    });
    if (selecionados.length > 0) {
      const idsSelecionados = selecionados.map(s => s.opcaoFreteId);
      const opcoesFiltradas = await prisma.opcaoFrete.findMany({
        where: { produtoId: id, id: { in: idsSelecionados } },
        orderBy: { ordem: 'asc' }
      });
      return NextResponse.json(opcoesFiltradas);
    }
  }

  const opcoes = await prisma.opcaoFrete.findMany({
    where: { produtoId: id },
    orderBy: { ordem: 'asc' }
  });
  return NextResponse.json(opcoes);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const opcao = await prisma.opcaoFrete.create({
    data: {
      produtoId: id,
      nome: body.nome,
      descricao: body.descricao || null,
      prazoDias: Number(body.prazoDias),
      preco: Number(body.preco) || 0,
      ativo: body.ativo ?? true,
      ordem: Number(body.ordem) || 0,
      tipoEnvioId: body.tipoEnvioId || null
    }
  });
  return NextResponse.json(opcao);
}