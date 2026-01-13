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

export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { produtoId, mensagem } = await request.json();

    // Verificar se produto aceita afiliados
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      select: {
        aceitaAfiliados: true,
        aprovacaoAutomatica: true
      }
    });

    if (!produto?.aceitaAfiliados) {
      return NextResponse.json({ error: 'Este produto não aceita afiliados' }, { status: 400 });
    }

    // Criar solicitação
    const solicitacao = await prisma.solicitacaoAfiliacao.create({
      data: {
        produtoId,
        afiliadoId: userId,
        mensagem,
        status: produto.aprovacaoAutomatica ? 'APROVADO' : 'PENDENTE'
      }
    });

    // Se aprovação automática, criar afiliação
    if (produto.aprovacaoAutomatica) {
      const produtoCompleto = await prisma.produto.findUnique({
        where: { id: produtoId },
        select: { comissaoPadrao: true }
      });

      await prisma.afiliacao.create({
        data: {
          codigo: `AFI-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          comissao: produtoCompleto?.comissaoPadrao || 30,
          afiliadoId: userId
        }
      });
    }

    return NextResponse.json({ success: true, solicitacao });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Você já solicitou afiliação para este produto' }, { status: 400 });
    }
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao solicitar afiliação' }, { status: 500 });
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

    const where: any = {};
    
    // Se não tem produtoId, buscar solicitações dos produtos do usuário
    if (!produtoId) {
      const produtos = await prisma.produto.findMany({
        where: { userId },
        select: { id: true }
      });
      where.produtoId = { in: produtos.map(p => p.id) };
    } else {
      where.produtoId = produtoId;
    }

    const solicitacoes = await prisma.solicitacaoAfiliacao.findMany({
      where,
      include: {
        afiliado: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        produto: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ solicitacoes });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar solicitações' }, { status: 500 });
  }
}
