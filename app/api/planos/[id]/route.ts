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

// GET - Buscar plano específico
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

    const plano = await prisma.planoOferta.findUnique({
      where: { id }
    });

    return NextResponse.json({ plano });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar plano' }, { status: 500 });
  }
}

// PATCH - Atualizar plano (dados básicos + configurações de checkout)
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
    const body = await request.json();
    console.log('🔍 API recebeu body:', body);
    console.log('🔍 Gênero recebido na API:', body.checkoutProvaSocialGenero);

    // Verificar permissão
    const plano = await prisma.planoOferta.findUnique({
      where: { id },
      include: {
        produto: {
          select: { userId: true }
        }
      }
    });

    if (!plano || plano.produto.userId !== userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Atualizar
    const updated = await prisma.planoOferta.update({
      where: { id },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        preco: body.preco ? parseFloat(body.preco) : undefined,
        ativo: body.ativo,
        checkoutBanner: body.checkoutBanner,
        checkoutLogoSuperior: body.checkoutLogoSuperior,
        checkoutLogoInferior: body.checkoutLogoInferior,
        checkoutCorPrimaria: body.checkoutCorPrimaria,
        checkoutCorSecundaria: body.checkoutCorSecundaria,
        checkoutCronometro: body.checkoutCronometro,
        checkoutTempoMinutos: body.checkoutTempoMinutos ? parseInt(body.checkoutTempoMinutos) : undefined,
        checkoutMensagemUrgencia: body.checkoutMensagemUrgencia,
        checkoutProvaSocial: body.checkoutProvaSocial,
        checkoutIntervaloPop: body.checkoutIntervaloPop ? parseInt(body.checkoutIntervaloPop) : undefined,
        checkoutProvaSocialGenero: body.checkoutProvaSocialGenero,
        checkoutAceitaPix: body.checkoutAceitaPix,
        checkoutAceitaCartao: body.checkoutAceitaCartao,
        checkoutAceitaBoleto: body.checkoutAceitaBoleto,
        checkoutMetodoPreferencial: body.checkoutMetodoPreferencial,
        checkoutCpfObrigatorio: body.checkoutCpfObrigatorio,
        checkoutTelObrigatorio: body.checkoutTelObrigatorio,
        checkoutPedirEndereco: body.checkoutPedirEndereco
      }
    });

    return NextResponse.json({ plano: updated });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar plano' }, { status: 500 });
  }
}

// DELETE - Excluir plano
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar permissão
    const plano = await prisma.planoOferta.findUnique({
      where: { id },
      include: {
        produto: {
          select: { userId: true }
        }
      }
    });

    if (!plano || plano.produto.userId !== userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    await prisma.planoOferta.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao excluir plano' }, { status: 500 });
  }
}
