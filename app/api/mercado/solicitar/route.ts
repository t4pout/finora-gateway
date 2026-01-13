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

function gerarCodigo() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { produtoId } = await request.json();

    if (!produtoId) {
      return NextResponse.json({ error: 'Produto não informado' }, { status: 400 });
    }

    // Buscar produto
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId }
    });

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Verificar se já tem afiliação para este produto
    const afiliacaoExistente = await prisma.afiliacao.findFirst({
      where: {
        afiliadoId: userId,
        // Aqui você pode adicionar um campo produtoId na tabela Afiliacao
        // Por enquanto, vamos criar uma nova afiliação genérica
      }
    });

    // Gerar código único
    let codigoUnico = gerarCodigo();
    let existe = await prisma.afiliacao.findUnique({
      where: { codigo: codigoUnico }
    });

    while (existe) {
      codigoUnico = gerarCodigo();
      existe = await prisma.afiliacao.findUnique({
        where: { codigo: codigoUnico }
      });
    }

    // Criar afiliação
    const afiliacao = await prisma.afiliacao.create({
      data: {
        afiliadoId: userId,
        codigo: codigoUnico,
        comissao: produto.comissao,
        status: 'ATIVO'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Afiliação criada com sucesso!',
      afiliacao
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao criar afiliação' }, { status: 500 });
  }
}
