import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Rastrear código de campanha
  const campCode = searchParams.get('camp');
  
  if (campCode) {
    // Incrementar clique da campanha
    try {
      await fetch(`${request.nextUrl.origin}/api/campanhas/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: campCode })
      });
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
    }
    
    // Salvar código no cookie para rastrear conversão depois
    const response = NextResponse.next();
    response.cookies.set('campanha_code', campCode, {
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/'
    });
    return response;
  }
  
  // Rastrear código de afiliado
  const refCode = searchParams.get('ref');
  
  if (refCode) {
    // Incrementar clique do afiliado
    try {
      await fetch(`${request.nextUrl.origin}/api/afiliados/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: refCode })
      });
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
    }
    
    // Salvar código no cookie
    const response = NextResponse.next();
    response.cookies.set('afiliado_code', refCode, {
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/'
    });
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
