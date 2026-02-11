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

// POST - Criar solicitação de afiliação
export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { produtoId, mensagem } = await request.json();

    if (!produtoId) {
      return NextResponse.json({ error: 'Produto não informado' }, { status: 400 });
    }

    // Verificar se produto existe e aceita afiliados
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId }
    });

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    if (!produto.aceitaAfiliados) {
      return NextResponse.json({ error: 'Este produto não aceita afiliados' }, { status: 400 });
    }

    // Verificar se já existe solicitação
    const solicitacaoExistente = await prisma.solicitacaoAfiliacao.findUnique({
      where: {
        produtoId_afiliadoId: {
          produtoId,
          afiliadoId: userId
        }
      }
    });

    if (solicitacaoExistente) {
      return NextResponse.json({ 
        error: 'Você já solicitou afiliação para este produto',
        status: solicitacaoExistente.status
      }, { status: 400 });
    }

    // Criar solicitação
    const status = produto.aprovacaoAutomatica ? 'APROVADO' : 'PENDENTE';

    const solicitacao = await prisma.solicitacaoAfiliacao.create({
      data: {
        produtoId,
        afiliadoId: userId,
        mensagem: mensagem || null,
        status
      }
    });

    return NextResponse.json({
      success: true,
      message: produto.aprovacaoAutomatica 
        ? 'Afiliação aprovada automaticamente!' 
        : 'Solicitação enviada! Aguarde aprovação do produtor.',
      solicitacao,
      aprovacaoAutomatica: produto.aprovacaoAutomatica
    });

  } catch (error) {
    console.error('Erro ao criar solicitação:', error);
    return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 });
  }
}

// GET - Listar solicitações do afiliado
export async function GET(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const solicitacoes = await prisma.solicitacaoAfiliacao.findMany({
      where: { afiliadoId: userId },
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            imagem: true,
            comissaoPadrao: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, solicitacoes });

  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    return NextResponse.json({ error: 'Erro ao buscar solicitações' }, { status: 500 });
  }
}