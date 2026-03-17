import { NextRequest, NextResponse } from 'next/server';
import efipay from '@/lib/efi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { valor, nome, cpf, descricao } = body;

    const cobBody = {
      calendario: { expiracao: 3600 },
      devedor: { cpf: cpf.replace(/\D/g, ''), nome },
      valor: { original: Number(valor).toFixed(2) },
      chave: process.env.EFI_PIX_KEY!,
      solicitacaoPagador: descricao || 'Pagamento Finora',
    };

    const cob = await efipay.pixCreateImmediateCharge([], cobBody);
    console.log('EFI PIX cob:', JSON.stringify(cob));

    const locId = cob.loc?.id;
    if (!locId) {
      return NextResponse.json({ error: 'Erro ao obter loc.id do PIX' }, { status: 500 });
    }

    const qrcode = await efipay.pixGenerateQRCode({ id: locId }, {});
    console.log('EFI PIX qrcode:', JSON.stringify(qrcode));

    return NextResponse.json({
      txid: cob.txid,
      pixCopiaECola: qrcode.qrcode,
      qrCodeImagem: qrcode.imagemQrcode,
      status: cob.status,
    });
  } catch (error: any) {
    console.error('Erro PIX Efi:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar PIX' }, { status: 500 });
  }
}