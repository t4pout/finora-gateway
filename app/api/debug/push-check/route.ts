import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarPushParaUsuario } from '@/lib/web-push';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'passe ?userId=xxx na URL' }, { status: 400 });
  }

  const diagnostico: any = {
    userId,
    vapidPublicConfigurada: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    vapidPrivateConfigurada: !!process.env.VAPID_PRIVATE_KEY,
  };

  try {
    const inscricoes = await prisma.pushSubscription.findMany({ where: { userId } });
    diagnostico.totalInscricoes = inscricoes.length;
    diagnostico.inscricoes = inscricoes.map(i => ({ id: i.id, endpoint: i.endpoint.substring(0, 60) + '...' }));
  } catch (e: any) {
    diagnostico.erroAoBuscarInscricoes = e.message;
  }

  try {
    await enviarPushParaUsuario(userId, {
      titulo: '🧪 Teste de diagnóstico',
      corpo: 'Se você recebeu isso, o envio funciona perfeitamente.'
    });
    diagnostico.envioResultado = 'Executou sem lançar exceção (ver totalInscricoes acima para saber se realmente enviou)';
  } catch (e: any) {
    diagnostico.envioErro = e.message;
    diagnostico.envioErroStack = e.stack;
  }

  return NextResponse.json(diagnostico, { status: 200 });
}