import { NextRequest, NextResponse } from 'next/server';
import efipay from '@/lib/efi';

export async function POST(req: NextRequest) {
  try {
    const chave = process.env.EFI_PIX_KEY!;
    
    const result = await efipay.pixConfigWebhook(
      { chave },
      { webhookUrl: 'https://www.finorapayments.com/api/efi/webhook' }
    );

    console.log('Webhook Efi registrado:', JSON.stringify(result));
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Erro ao registrar webhook Efi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}