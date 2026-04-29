import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const planoId = params.id;

    const plano = await prisma.planoOferta.findUnique({
      where: { id: planoId },
      include: { produto: true }
    });

    if (!plano) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ plano });
  } catch (error: any) {
    console.error('❌ ERRO:', error.message);
    return NextResponse.json({ error: 'Erro ao buscar plano', details: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }
    jwt.verify(token, process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura');

    const { id: planoId } = await context.params;
    const body = await request.json();

    console.log('📝 Atualizando plano:', planoId);

    const data: any = {};
    if (body.nome !== undefined) data.nome = body.nome;
    if (body.descricao !== undefined) data.descricao = body.descricao;
    if (body.preco !== undefined) data.preco = parseFloat(body.preco);
    if (body.ativo !== undefined) data.ativo = body.ativo;
    if (body.checkoutBanner !== undefined) data.checkoutBanner = body.checkoutBanner;
    if (body.checkoutLogoSuperior !== undefined) data.checkoutLogoSuperior = body.checkoutLogoSuperior;
    if (body.checkoutLogoInferior !== undefined) data.checkoutLogoInferior = body.checkoutLogoInferior;
    if (body.checkoutCorPrimaria !== undefined) data.checkoutCorPrimaria = body.checkoutCorPrimaria;
    if (body.checkoutCorSecundaria !== undefined) data.checkoutCorSecundaria = body.checkoutCorSecundaria;
    if (body.checkoutCronometro !== undefined) data.checkoutCronometro = body.checkoutCronometro;
    if (body.checkoutTempoMinutos !== undefined) data.checkoutTempoMinutos = body.checkoutTempoMinutos;
    if (body.checkoutMensagemUrgencia !== undefined) data.checkoutMensagemUrgencia = body.checkoutMensagemUrgencia;
    if (body.checkoutProvaSocial !== undefined) data.checkoutProvaSocial = body.checkoutProvaSocial;
    if (body.checkoutIntervaloPop !== undefined) data.checkoutIntervaloPop = body.checkoutIntervaloPop;
    if (body.checkoutProvaSocialGenero !== undefined) data.checkoutProvaSocialGenero = body.checkoutProvaSocialGenero;
    if (body.checkoutAceitaPix !== undefined) data.checkoutAceitaPix = body.checkoutAceitaPix;
    if (body.checkoutAceitaCartao !== undefined) data.checkoutAceitaCartao = body.checkoutAceitaCartao;
    if (body.checkoutAceitaBoleto !== undefined) data.checkoutAceitaBoleto = body.checkoutAceitaBoleto;
    if (body.checkoutMetodoPreferencial !== undefined) data.checkoutMetodoPreferencial = body.checkoutMetodoPreferencial;
    if (body.checkoutCpfObrigatorio !== undefined) data.checkoutCpfObrigatorio = body.checkoutCpfObrigatorio;
    if (body.checkoutTelObrigatorio !== undefined) data.checkoutTelObrigatorio = body.checkoutTelObrigatorio;
    if (body.checkoutPedirEndereco !== undefined) data.checkoutPedirEndereco = body.checkoutPedirEndereco;
    if (body.checkoutVersao !== undefined) data.checkoutVersao = body.checkoutVersao;
    if (body.checkoutPadBanner !== undefined) data.checkoutPadBanner = body.checkoutPadBanner;
    if (body.checkoutPadLogoSuperior !== undefined) data.checkoutPadLogoSuperior = body.checkoutPadLogoSuperior;
    if (body.checkoutPadLogoInferior !== undefined) data.checkoutPadLogoInferior = body.checkoutPadLogoInferior;
    if (body.checkoutPadCorPrimaria !== undefined) data.checkoutPadCorPrimaria = body.checkoutPadCorPrimaria;
    if (body.checkoutPadCorSecundaria !== undefined) data.checkoutPadCorSecundaria = body.checkoutPadCorSecundaria;
    if (body.checkoutPadCronometro !== undefined) data.checkoutPadCronometro = body.checkoutPadCronometro;
    if (body.checkoutPadTempoMinutos !== undefined) data.checkoutPadTempoMinutos = body.checkoutPadTempoMinutos;
    if (body.checkoutPadMensagemUrgencia !== undefined) data.checkoutPadMensagemUrgencia = body.checkoutPadMensagemUrgencia;
    if (body.checkoutPadProvaSocial !== undefined) data.checkoutPadProvaSocial = body.checkoutPadProvaSocial;
    if (body.checkoutPadIntervaloPop !== undefined) data.checkoutPadIntervaloPop = body.checkoutPadIntervaloPop;
    if (body.checkoutPadProvaSocialGenero !== undefined) data.checkoutPadProvaSocialGenero = body.checkoutPadProvaSocialGenero;

    const plano = await prisma.planoOferta.update({
      where: { id: planoId },
      data
    });

    console.log('✅ Plano atualizado com sucesso');
    return NextResponse.json({ success: true, plano });
  } catch (error: any) {
    console.error('❌ Erro ao atualizar plano:', error);
    return NextResponse.json({ error: 'Erro ao atualizar plano', details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    jwt.verify(token, process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura');

    const { id: planoId } = await context.params;
    await prisma.planoOferta.delete({ where: { id: planoId } });

    return NextResponse.json({ success: true, message: 'Plano deletado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar plano:', error);
    return NextResponse.json({ error: 'Erro ao deletar plano', details: error.message }, { status: 500 });
  }
}