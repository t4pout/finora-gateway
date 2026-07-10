import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'finora-secret-super-seguro-2026-production';

export async function POST(request: NextRequest) {
  try {
    // Verificar se quem está chamando é ADMIN
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const adminToken = authHeader.substring(7);
    const adminDecoded = jwt.verify(adminToken, JWT_SECRET) as { userId: string, role: string };

    if (adminDecoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas administradores' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    // Buscar usuário alvo
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Gerar token para o usuário alvo
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`🔐 Admin ${adminDecoded.userId} logou como ${user.email}`);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        verificado: user.verificado,
        statusVerificacao: user.statusVerificacao,
        finoraUtmAtivo: user.finoraUtmAtivo
      }
    });

  } catch (error) {
    console.error('Erro ao fazer login como usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}