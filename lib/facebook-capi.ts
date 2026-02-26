import crypto from 'crypto';

interface EventoPixel {
  pixelId: string;
  accessToken: string;
  eventName: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentIds?: string[];
  email?: string;
  phone?: string;
}

export async function dispararEventoCAPI(evento: EventoPixel) {
  try {
    const eventId = crypto.randomUUID();
    const timestamp = Math.floor(Date.now() / 1000);

    const userData: any = {};
    if (evento.email) userData.em = [crypto.createHash('sha256').update(evento.email.toLowerCase().trim()).digest('hex')];
    if (evento.phone) userData.ph = [crypto.createHash('sha256').update(evento.phone.replace(/\D/g, '')).digest('hex')];

    const customData: any = { currency: evento.currency || 'BRL' };
    if (evento.value) customData.value = evento.value;
    if (evento.contentName) customData.content_name = evento.contentName;
    if (evento.contentIds) { customData.content_ids = evento.contentIds; customData.content_type = 'product'; }

    const payload = {
      data: [{
        event_name: evento.eventName,
        event_time: timestamp,
        event_id: eventId,
        action_source: 'website',
        user_data: userData,
        custom_data: customData
      }]
    };

    const url = 'https://graph.facebook.com/v18.0/' + evento.pixelId + '/events?access_token=' + evento.accessToken;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    console.log('CAPI ' + evento.eventName + ':', JSON.stringify(result));
    return { success: res.ok, eventId };
  } catch (error) {
    console.error('Erro CAPI:', error);
    return { success: false };
  }
}