import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

function getUserId(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura') as any;
    return decoded.userId || decoded.id;
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const clientId = process.env.BLING_CLIENT_ID;
    if (!clientId) return NextResponse.json({ error: 'BLING_CLIENT_ID não configurado' }, { status: 500 });

    const redirectUri = 'https://www.finorapayments.com/api/integracoes/bling/callback';

    const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${userId}`;

    return NextResponse.json({ url: authUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}