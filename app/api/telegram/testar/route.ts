import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botToken, chatId } = body;

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Token e Chat ID são obrigatórios' },
        { status: 400 }
      );
    }

    const mensagem = '🧪 <b>TESTE DE NOTIFICAÇÃO</b>\n\n✅ Suas configurações do Telegram estão funcionando corretamente!\n\n🔔 Você receberá notificações sempre que um novo pedido PAD for criado.';

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensagem,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('Erro Telegram API:', data);
      return NextResponse.json(
        { error: data.description || 'Erro ao enviar mensagem' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro ao testar Telegram:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar mensagem de teste' },
      { status: 500 }
    );
  }
}