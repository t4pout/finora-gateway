import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura-2026-finora';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI;
    const state = decoded.userId;

    const url = 'https://www.facebook.com/v19.0/dialog/oauth?' +
      'client_id=' + appId +
      '&redirect_uri=' + encodeURIComponent(redirectUri!) +
      '&state=' + state +
      '&scope=ads_read,ads_management,business_management';

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao gerar URL' }, { status: 500 });
  }
}