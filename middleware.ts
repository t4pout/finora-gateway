import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};