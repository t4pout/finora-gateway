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

export async function GET(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const produtoId = searchParams.get('produtoId');

    if (!produtoId) {
      return NextResponse.json({ error: 'Produto não informado' }, { status: 400 });
    }

    const paginas = await prisma.paginaOferta.findMany({
      where: { produtoId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, paginas });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar páginas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { nome, link, produtoId } = await request.json();

    if (!nome || !link || !produtoId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const pagina = await prisma.paginaOferta.create({
      data: { nome, link, produtoId }
    });

    return NextResponse.json({ success: true, pagina });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao criar página' }, { status: 500 });
  }
}
