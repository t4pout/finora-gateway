import { NextResponse } from 'next/server';
import efipay from '@/lib/efi';

export async function GET() {
  try {
    const chave = process.env.EFI_PIX_KEY!;
    const result = await efipay.pixDetailWebhook({ chave }, {});
    console.log('Webhook consultado:', JSON.stringify(result));
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Erro consultar webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}