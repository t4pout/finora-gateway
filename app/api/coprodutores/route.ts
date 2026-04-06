import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET — listar co-produtores de um produto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const produtoId = searchParams.get('produtoId');

    if (!produtoId) {
      return NextResponse.json({ error: 'produtoId obrigatório' }, { status: 400 });
    }

    const coProdutores = await prisma.coProdutorProduto.findMany({
      where: { produtoId },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(coProdutores);
  } catch (error: any) {
    console.error('Erro ao listar co-produtores:', error);
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 });
  }
}

// POST — adicionar co-produtor
export async function POST(request: NextRequest) {
  try {
    const { produtoId, email, tipo, valor } = await request.json();

    if (!produtoId || !email || !tipo || valor === undefined) {
      return NextResponse.json({ error: 'Campos obrigatórios: produtoId, email, tipo, valor' }, { status: 400 });
    }

    if (!['PERCENTUAL', 'FIXO'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo deve ser PERCENTUAL ou FIXO' }, { status: 400 });
    }

    if (valor <= 0) {
      return NextResponse.json({ error: 'Valor deve ser maior que zero' }, { status: 400 });
    }

    if (tipo === 'PERCENTUAL' && valor > 90) {
      return NextResponse.json({ error: 'Percentual máximo permitido: 90%' }, { status: 400 });
    }

    // Busca o usuário co-produtor pelo email
    const coProdutorUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!coProdutorUser) {
      return NextResponse.json({ error: 'Nenhuma conta Finora encontrada com esse email' }, { status: 404 });
    }

    // Verifica se o produto existe
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId }
    });

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Não pode adicionar o próprio dono do produto
    if (coProdutorUser.id === produto.userId) {
      return NextResponse.json({ error: 'O dono do produto não pode ser co-produtor' }, { status: 400 });
    }

    // Verifica se já existe
    const jaExiste = await prisma.coProdutorProduto.findUnique({
      where: { produtoId_usuarioId: { produtoId, usuarioId: coProdutorUser.id } }
    });

    if (jaExiste) {
      return NextResponse.json({ error: 'Esse usuário já é co-produtor deste produto' }, { status: 400 });
    }

    const coProdutor = await prisma.coProdutorProduto.create({
      data: {
        produtoId,
        usuarioId: coProdutorUser.id,
        tipo,
        valor,
        ativo: true
      },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, avatar: true }
        }
      }
    });

    return NextResponse.json(coProdutor, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao adicionar co-produtor:', error);
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 });
  }
}

// DELETE — remover co-produtor
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
    }

    await prisma.coProdutorProduto.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao remover co-produtor:', error);
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 });
  }
}

// PATCH — ativar/desativar ou editar valor
export async function PATCH(request: NextRequest) {
  try {
    const { id, tipo, valor, ativo } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
    }

    const atualizado = await prisma.coProdutorProduto.update({
      where: { id },
      data: {
        ...(tipo !== undefined && { tipo }),
        ...(valor !== undefined && { valor }),
        ...(ativo !== undefined && { ativo })
      },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, avatar: true }
        }
      }
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    console.error('Erro ao atualizar co-produtor:', error);
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 });
  }
}