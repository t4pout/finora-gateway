import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botToken, chatId, mensagem } = body;

    // Se não tiver credenciais, usa as padrões (backward compatibility)
    const tokenFinal = botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatIdFinal = chatId || process.env.TELEGRAM_CHAT_ID;

    if (!tokenFinal || !chatIdFinal) {
      console.log('⚠️ Telegram não configurado, pulando notificação');
      return NextResponse.json({ success: true, skipped: true });
    }

    if (!mensagem) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api.telegram.org/bot${tokenFinal}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatIdFinal,
        text: mensagem,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('❌ Erro Telegram API:', data);
      // Não retorna erro para não quebrar o fluxo de criação do pedido
      return NextResponse.json({ success: false, error: data.description });
    }

    console.log('✅ Notificação Telegram enviada');
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Erro ao enviar notificação Telegram:', error);
    // Não retorna erro para não quebrar o fluxo
    return NextResponse.json({ success: false, error: error.message });
  }
}