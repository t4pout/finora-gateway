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
        checkoutBanner: true,
        checkoutLogoSuperior: true,
        checkoutLogoInferior: true,
        checkoutCorPrimaria: true,
        checkoutCorSecundaria: true,
        checkoutCronometro: true,
        checkoutTempoMinutos: true,
        checkoutMensagemUrgencia: true,
        checkoutProvaSocial: true,
        checkoutIntervaloPop: true,
        checkoutAceitaPix: true,
        checkoutAceitaCartao: true,
        checkoutAceitaBoleto: true,
        checkoutMetodoPreferencial: true,
        checkoutCpfObrigatorio: true,
        checkoutTelObrigatorio: true,
        checkoutPedirEndereco: true
      }
    });

    return NextResponse.json({ config: produto });
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
    const body = await request.json();

    const produto = await prisma.produto.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!produto || produto.userId !== userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const updated = await prisma.produto.update({
      where: { id },
      data: {
        checkoutBanner: body.checkoutBanner,
        checkoutLogoSuperior: body.checkoutLogoSuperior,
        checkoutLogoInferior: body.checkoutLogoInferior,
        checkoutCorPrimaria: body.checkoutCorPrimaria,
        checkoutCorSecundaria: body.checkoutCorSecundaria,
        checkoutCronometro: body.checkoutCronometro,
        checkoutTempoMinutos: body.checkoutTempoMinutos ? parseInt(body.checkoutTempoMinutos) : null,
        checkoutMensagemUrgencia: body.checkoutMensagemUrgencia,
        checkoutProvaSocial: body.checkoutProvaSocial,
        checkoutIntervaloPop: body.checkoutIntervaloPop ? parseInt(body.checkoutIntervaloPop) : null,
        checkoutAceitaPix: body.checkoutAceitaPix,
        checkoutAceitaCartao: body.checkoutAceitaCartao,
        checkoutAceitaBoleto: body.checkoutAceitaBoleto,
        checkoutMetodoPreferencial: body.checkoutMetodoPreferencial,
        checkoutCpfObrigatorio: body.checkoutCpfObrigatorio,
        checkoutTelObrigatorio: body.checkoutTelObrigatorio,
        checkoutPedirEndereco: body.checkoutPedirEndereco
      }
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error('Erro ao salvar:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
