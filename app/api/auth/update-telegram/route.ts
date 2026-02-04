import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'finora-secret-super-seguro-2026-production';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const body = await request.json();
    const { telegramBotToken, telegramChatId } = body;

    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        telegramBotToken,
        telegramChatId
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao atualizar Telegram:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}