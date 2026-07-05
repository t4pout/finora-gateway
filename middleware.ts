import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

// Rotas do dashboard que são LIBERADAS mesmo sem verificação
const ROTAS_LIBERADAS = [
  '/dashboard/verificacao',
  '/dashboard/perfil',
];

// Rotas públicas que não precisam de autenticação
const ROTAS_PUBLICAS = [
  '/auth',
  '/checkout',
  '/pedido',
  '/pad',
  '/afiliacao',
  '/termos',
  '/privacidade',
  '/finora-utm',
];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Rastrear código de campanha
  const campCode = searchParams.get('camp');
  if (campCode) {
    try {
      await fetch(`${request.nextUrl.origin}/api/campanhas/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: campCode })
      });
    } catch (error) { console.error('Erro ao registrar clique:', error); }
    const response = NextResponse.next();
    response.cookies.set('campanha_code', campCode, { maxAge: 60 * 60 * 24 * 30, path: '/' });
    return response;
  }

  // Rastrear código de afiliado
  const refCode = searchParams.get('ref');
  if (refCode) {
    try {
      await fetch(`${request.nextUrl.origin}/api/afiliados/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: refCode })
      });
    } catch (error) { console.error('Erro ao registrar clique:', error); }
    const response = NextResponse.next();
    response.cookies.set('afiliado_code', refCode, { maxAge: 60 * 60 * 24 * 30, path: '/' });
    return response;
  }

  // Verificar se é rota do dashboard
  if (pathname.startsWith('/dashboard')) {
    // Rotas liberadas sem verificação
    if (ROTAS_LIBERADAS.some(r => pathname.startsWith(r))) {
      return NextResponse.next();
    }

    // Verificar token
    const authHeader = request.headers.get('authorization');
    const tokenCookie = request.cookies.get('token')?.value;
    const token = authHeader?.replace('Bearer ', '') || tokenCookie;

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Admin sempre passa
      if (decoded.role === 'ADMIN') return NextResponse.next();

      // Buscar status de verificação do usuário
      const userRes = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        const verificado = userData.user?.verificado;
        const statusVerificacao = userData.user?.statusVerificacao;

        // Se não verificado, redireciona para página de verificação
        if (!verificado && statusVerificacao !== 'APROVADO') {
          return NextResponse.redirect(new URL('/dashboard/verificacao', request.url));
        }
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};