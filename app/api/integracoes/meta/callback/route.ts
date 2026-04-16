import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect('https://finorapayments.com/finora-utm/integracoes?erro=acesso_negado');
  }

  if (!code || !state) {
    return NextResponse.redirect('https://finorapayments.com/finora-utm/integracoes?erro=parametros_invalidos');
  }

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI;

    const tokenRes = await fetch(
      'https://graph.facebook.com/v19.0/oauth/access_token?' +
      'client_id=' + appId +
      '&redirect_uri=' + encodeURIComponent(redirectUri!) +
      '&client_secret=' + appSecret +
      '&code=' + code
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect('https://finorapayments.com/finora-utm/integracoes?erro=token_invalido');
    }

    const accessToken = tokenData.access_token;

    const accountsRes = await fetch(
      'https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name&access_token=' + accessToken
    );
    const accountsData = await accountsRes.json();
    const primeiraContaId = accountsData.data?.[0]?.id || null;
    const primeiraContaNome = accountsData.data?.[0]?.name || null;

    await prisma.integracaoAnuncio.upsert({
      where: { userId_plataforma: { userId: state, plataforma: 'META' } },
      update: { accessToken, accountId: primeiraContaId, accountNome: primeiraContaNome, ativo: true },
      create: { userId: state, plataforma: 'META', accessToken, accountId: primeiraContaId, accountNome: primeiraContaNome }
    });

    return NextResponse.redirect('https://finorapayments.com/finora-utm/integracoes?sucesso=meta');
  } catch (error) {
    console.error('Erro callback Meta:', error);
    return NextResponse.redirect('https://finorapayments.com/finora-utm/integracoes?erro=erro_interno');
  }
}