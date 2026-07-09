import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura-2026-finora';

function verificarToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { expoPushToken } = await request.json();
    if (!expoPushToken) {
      return NextResponse.json({ error: 'expoPushToken é obrigatório' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { expoPushToken },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar push token:', error);
    return NextResponse.json({ error: 'Erro ao salvar token' }, { status: 500 });
  }
}
