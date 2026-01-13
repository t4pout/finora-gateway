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

    // Buscar TODOS os produtos ATIVOS e PÚBLICOS
    const produtos = await prisma.produto.findMany({
      where: {
        status: 'ATIVO',
        publicoParaAfiliados: true
      },
      include: {
        user: {
          select: {
            nome: true
          }
        },
        _count: {
          select: {
            vendas: true
          }
        }
      },
      orderBy: {
        comissao: 'desc'
      }
    });

    // Mapear produtos com contador de vendas
    const produtosComVendas = produtos.map(p => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      tipo: p.tipo,
      preco: p.preco,
      comissao: p.comissao,
      imagem: p.imagem,
      vendas: p._count.vendas,
      vendedor: p.user.nome,
      isMeuProduto: p.userId === userId
    }));

    return NextResponse.json({ success: true, produtos: produtosComVendas });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}
