import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

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

// GET - Listar planos de um produto
export async function GET(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const produtoId = searchParams.get('produtoId');

    if (!produtoId) {
      return NextResponse.json({ error: 'produtoId obrigatório' }, { status: 400 });
    }

    const planos = await prisma.planoOferta.findMany({
      where: { produtoId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ planos });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar planos' }, { status: 500 });
  }
}

// POST - Criar novo plano
export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { produtoId, nome, descricao, preco } = body;

    // Verificar se o produto pertence ao usuário
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      select: { userId: true }
    });

    if (!produto || produto.userId !== userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Gerar link único
    const linkUnico = randomBytes(16).toString('hex');

    const plano = await prisma.planoOferta.create({
      data: {
        nome,
        descricao,
        preco: parseFloat(preco),
        linkUnico,
        produtoId
      }
    });

    return NextResponse.json({ plano });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao criar plano' }, { status: 500 });
  }
}
