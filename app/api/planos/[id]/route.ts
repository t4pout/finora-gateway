import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 Iniciando busca de plano...');
    const params = await context.params;
    const planoId = params.id;
    
    if (!prisma || !prisma.planoOferta) {
      return NextResponse.json(
        { error: 'Erro de configuração do banco de dados' },
        { status: 500 }
      );
    }
    
    const plano = await prisma.planoOferta.findUnique({
      where: { id: planoId },
      include: { produto: true }
    });
    
    if (!plano) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ plano });
  } catch (error: any) {
    console.error('❌ ERRO:', error.message);
    return NextResponse.json(
      { error: 'Erro ao buscar plano', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TEMPORARIAMENTE SEM JWT PARA TESTAR
    // const token = request.headers.get('authorization')?.replace('Bearer ', '');
    // if (!token) {
    //   return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    // }
    // jwt.verify(token, process.env.JWT_SECRET!);
    
    const { id: planoId } = await context.params;
    const body = await request.json();

    console.log('📝 Atualizando plano:', planoId);
    console.log('📦 Dados recebidos:', body);

    const plano = await prisma.planoOferta.update({
      where: { id: planoId },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        preco: body.preco,
        ativo: body.ativo,
        checkoutBanner: body.checkoutBanner,
        checkoutLogoSuperior: body.checkoutLogoSuperior,
        checkoutLogoInferior: body.checkoutLogoInferior,
        checkoutCorPrimaria: body.checkoutCorPrimaria,
        checkoutCorSecundaria: body.checkoutCorSecundaria,
        checkoutCronometro: body.checkoutCronometro,
        checkoutTempoMinutos: body.checkoutTempoMinutos,
        checkoutMensagemUrgencia: body.checkoutMensagemUrgencia,
        checkoutProvaSocial: body.checkoutProvaSocial,
        checkoutIntervaloPop: body.checkoutIntervaloPop,
        checkoutProvaSocialGenero: body.checkoutProvaSocialGenero,
        checkoutAceitaPix: body.checkoutAceitaPix,
        checkoutAceitaCartao: body.checkoutAceitaCartao,
        checkoutAceitaBoleto: body.checkoutAceitaBoleto,
        checkoutMetodoPreferencial: body.checkoutMetodoPreferencial,
        checkoutCpfObrigatorio: body.checkoutCpfObrigatorio,
        checkoutTelObrigatorio: body.checkoutTelObrigatorio,
        checkoutPedirEndereco: body.checkoutPedirEndereco,
        checkoutPadBanner: body.checkoutPadBanner,
        checkoutPadLogoSuperior: body.checkoutPadLogoSuperior,
        checkoutPadLogoInferior: body.checkoutPadLogoInferior,
        checkoutPadCorPrimaria: body.checkoutPadCorPrimaria,
        checkoutPadCorSecundaria: body.checkoutPadCorSecundaria,
        checkoutPadCronometro: body.checkoutPadCronometro,
        checkoutPadTempoMinutos: body.checkoutPadTempoMinutos,
        checkoutPadMensagemUrgencia: body.checkoutPadMensagemUrgencia,
        checkoutPadProvaSocial: body.checkoutPadProvaSocial,
        checkoutPadIntervaloPop: body.checkoutPadIntervaloPop,
        checkoutPadProvaSocialGenero: body.checkoutPadProvaSocialGenero,
      }
    });

    console.log('✅ Plano atualizado com sucesso');
    return NextResponse.json({ success: true, plano });
  } catch (error: any) {
    console.error('❌ Erro ao atualizar plano:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar plano', details: error.message },
      { status: 500 }
    );
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
    
    jwt.verify(token, process.env.JWT_SECRET!);
    
    const { id: planoId } = await context.params;
    await prisma.planoOferta.delete({ where: { id: planoId } });

    return NextResponse.json({ 
      success: true,
      message: 'Plano deletado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao deletar plano:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar plano', details: error.message },
      { status: 500 }
    );
  }
}