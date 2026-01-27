import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 Buscando plano...');
    console.log('📦 Context recebido:', context);
    
    const params = await context.params;
    console.log('📦 Params resolvidos:', params);
    
    const planoId = params.id;
    console.log('🔑 Plano ID:', planoId);

    const plano = await prisma.plano.findUnique({
      where: { id: planoId },
      include: {
        produto: true
      }
    });

    console.log('✅ Plano encontrado:', plano);

    if (!plano) {
      console.log('❌ Plano não existe no banco');
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ plano });

  } catch (error: any) {
    console.error('❌ ERRO COMPLETO:', error);
    console.error('❌ ERRO MESSAGE:', error.message);
    console.error('❌ ERRO STACK:', error.stack);
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!);
    
    const { id: planoId } = await context.params;
    const body = await request.json();

    const plano = await prisma.plano.update({
      where: { id: planoId },
      data: body
    });

    return NextResponse.json({ plano });

  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar plano' },
      { status: 500 }
    );
  }
}