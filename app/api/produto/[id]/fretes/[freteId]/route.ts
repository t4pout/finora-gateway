import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string; freteId: string } }) {
  const body = await req.json();
  const opcao = await prisma.opcaoFrete.update({
    where: { id: params.freteId },
    data: {
      nome: body.nome,
      descricao: body.descricao || null,
      prazoDias: Number(body.prazoDias),
      preco: Number(body.preco) || 0,
      ativo: body.ativo,
      ordem: Number(body.ordem) || 0
    }
  });
  return NextResponse.json(opcao);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; freteId: string } }) {
  await prisma.opcaoFrete.delete({ where: { id: params.freteId } });
  return NextResponse.json({ ok: true });
}