import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard/integracoes?erro=codigo_invalido', request.url));
    }

    // Trocar code por access_token
    const credentials = Buffer.from(
      process.env.BLING_CLIENT_ID + ':' + process.env.BLING_CLIENT_SECRET
    ).toString('base64');

    const tokenResponse = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + credentials
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://www.finorapayments.com/api/integracoes/bling/callback'
      })
    });

    const tokenData = await tokenResponse.json();
    console.log('🔑 Token Bling:', JSON.stringify(tokenData));

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('❌ Erro ao obter token:', tokenData);
      return NextResponse.redirect(new URL('/dashboard/integracoes?erro=token_invalido', request.url));
    }

    // state contém o userId
    const userId = state;
    if (!userId) {
      return NextResponse.redirect(new URL('/dashboard/integracoes?erro=usuario_invalido', request.url));
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 21600) * 1000);

    await prisma.integracaoBling.upsert({
      where: { userId },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: expiresAt,
        ativo: true
      },
      create: {
        userId,
        clientId: process.env.BLING_CLIENT_ID || '',
        clientSecret: process.env.BLING_CLIENT_SECRET || '',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: expiresAt,
        ativo: true
      }
    });

    return NextResponse.redirect(new URL('/dashboard/integracoes?sucesso=bling_conectado', request.url));
  } catch (error: any) {
    console.error('❌ Erro callback Bling:', error);
    return NextResponse.redirect(new URL('/dashboard/integracoes?erro=erro_interno', request.url));
  }
}