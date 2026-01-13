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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const produto = await prisma.produto.findUnique({
      where: { id },
      select: {
        aceitaAfiliados: true,
        aprovacaoAutomatica: true,
        comissaoPadrao: true,
        detalhesAfiliacao: true,
        regrasAfiliacao: true,
        linkConvite: true
      }
    });

    return NextResponse.json({ produto });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
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
    const {
      aceitaAfiliados,
      aprovacaoAutomatica,
      comissaoPadrao,
      detalhesAfiliacao,
      regrasAfiliacao
    } = await request.json();

    // Gerar link de convite se não existir
    let linkConvite = null;
    const produtoAtual = await prisma.produto.findUnique({
      where: { id },
      select: { linkConvite: true }
    });

    if (!produtoAtual?.linkConvite && aceitaAfiliados) {
      linkConvite = randomBytes(16).toString('hex');
    }

    const produto = await prisma.produto.update({
      where: { id },
      data: {
        aceitaAfiliados,
        aprovacaoAutomatica,
        comissaoPadrao: parseFloat(comissaoPadrao),
        detalhesAfiliacao,
        regrasAfiliacao,
        ...(linkConvite && { linkConvite })
      }
    });

    return NextResponse.json({ success: true, produto });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
  }
}
