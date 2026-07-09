// Envia uma notificação push pro celular do vendedor, via serviço da Expo.
// Não precisa de nenhuma chave/API key — o serviço da Expo é gratuito e público.
export async function enviarNotificacaoPush(
  expoPushToken: string | null | undefined,
  titulo: string,
  corpo: string,
  dados: Record<string, any> = {}
) {
  if (!expoPushToken) return; // vendedor ainda não abriu o app mobile ou negou permissão

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: 'default',
        title: titulo,
        body: corpo,
        data: dados,
      }),
    });
  } catch (error) {
    console.error('Erro ao enviar notificação push:', error);
  }
}
