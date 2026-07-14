import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
      ordem: Number(body.ordem) || 0
    }
  });
  return NextResponse.json(opcao);
}