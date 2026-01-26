import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

function verificarToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const produto = await prisma.produto.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        descricao: true,
        tipo: true,
        preco: true,
        comissao: true,
        imagem: true,
        status: true,
        publicoParaAfiliados: true,
        estoque: true,
        userId: true,
        padHabilitado: true
      }
    });

    return NextResponse.json({ produto });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    const { nome, descricao, tipo, preco, comissao, estoque, arquivoUrl, status } = await request.json();

    const produto = await prisma.produto.findFirst({
      where: { id, userId }
    });

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: {
        nome,
        descricao,
        tipo,
        preco: parseFloat(preco),
        comissao: comissao ? parseFloat(comissao) : 0,
        estoque: tipo === 'FISICO' && estoque ? parseInt(estoque) : null,
        arquivoUrl: tipo === 'DIGITAL' ? arquivoUrl : null,
        status
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Produto atualizado!',
      produto: produtoAtualizado
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await context.params;

    const produto = await prisma.produto.findFirst({
      where: { id, userId }
    });

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    await prisma.produto.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Produto excluído!'
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 });
  }
}
