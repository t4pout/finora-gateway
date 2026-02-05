import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

// Middleware para verificar token
function verificarToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// GET - Listar produtos do usuário
export async function GET(request: NextRequest) {
  try {
    const userId = verificarToken(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const produtos = await prisma.produto.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      produtos
    });

  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

// POST - Criar produto
export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { nome, descricao, tipo, preco, comissao, estoque, arquivoUrl, imagem, publicoParaAfiliados } = await request.json();

    // Validações
    if (!nome || !tipo || !preco) {
      return NextResponse.json(
        { error: 'Nome, tipo e preço são obrigatórios' },
        { status: 400 }
      );
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao: descricao || '',
        tipo,
        preco: parseFloat(preco),
        comissao: comissao ? parseFloat(comissao) : 0,
        estoque: tipo === 'FISICO' ? parseInt(estoque || 0) : null,
        arquivoUrl: tipo === 'DIGITAL' ? arquivoUrl : null,
        imagem: imagem || null,
        publicoParaAfiliados: publicoParaAfiliados !== undefined ? publicoParaAfiliados : true,
        userId,
        status: 'ATIVO'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Produto criado com sucesso!',
      produto
    });

  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    );
  }
}


