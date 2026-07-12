import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@finorapayments.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface DadosNotificacao {
  titulo: string;
  corpo: string;
  url?: string;
}

// Envia uma notificação push para todas as inscrições ativas de um usuário.
// Remove automaticamente inscrições expiradas/inválidas (erro 404/410).
export async function enviarPushParaUsuario(userId: string, dados: DadosNotificacao) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('⚠️ VAPID não configurado, pulando push notification');
    return;
  }

  try {
    const inscricoes = await prisma.pushSubscription.findMany({ where: { userId } });
    if (inscricoes.length === 0) return;

    const payload = JSON.stringify({
      title: dados.titulo,
      body: dados.corpo,
      url: dados.url || '/dashboard'
    });

    for (const inscricao of inscricoes) {
      try {
        await webpush.sendNotification(
          {
            endpoint: inscricao.endpoint,
            keys: { p256dh: inscricao.p256dh, auth: inscricao.auth }
          },
          payload
        );
        console.log('✅ Push enviado para inscrição:', inscricao.id);
      } catch (e: any) {
        console.error('❌ Erro ao enviar push:', e.statusCode, e.message);
        if (e.statusCode === 404 || e.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: inscricao.id } }).catch(() => {});
          console.log('🗑️ Inscrição expirada removida:', inscricao.id);
        }
      }
    }
  } catch (e) {
    console.error('❌ Erro geral ao enviar push:', e);
  }
}