import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mensagem } = body;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('❌ Telegram não configurado');
      return NextResponse.json({ error: 'Telegram não configurado' }, { status: 500 });
    }

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: mensagem,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem');
    }

    console.log('✅ Notificação Telegram enviada:', mensagem);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Erro ao enviar Telegram:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}