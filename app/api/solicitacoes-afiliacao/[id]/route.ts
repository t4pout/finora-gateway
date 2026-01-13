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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { status, motivoRejeicao } = await request.json();

    // Verificar se a solicitação pertence a um produto do usuário
    const solicitacao = await prisma.solicitacaoAfiliacao.findUnique({
      where: { id },
      include: {
        produto: {
          select: {
            userId: true,
            comissaoPadrao: true
          }
        }
      }
    });

    if (!solicitacao) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    if (solicitacao.produto.userId !== userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Atualizar solicitação
    await prisma.solicitacaoAfiliacao.update({
      where: { id },
      data: {
        status,
        motivoRejeicao: status === 'REJEITADO' ? motivoRejeicao : null
      }
    });

    // Se aprovado, criar afiliação
    if (status === 'APROVADO') {
      const codigo = `AFI-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      await prisma.afiliacao.create({
        data: {
          codigo,
          comissao: solicitacao.produto.comissaoPadrao,
          afiliadoId: solicitacao.afiliadoId
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar solicitação' }, { status: 500 });
  }
}
