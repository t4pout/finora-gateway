import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { enviarPushParaUsuario } from '@/lib/web-push';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'finora-secret-super-seguro-2026-production';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    await enviarPushParaUsuario(decoded.userId, {
      titulo: '🔔 Finora Payments',
      corpo: 'Notificações ativadas com sucesso!'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao enviar teste' }, { status: 500 });
  }
}