import { NextRequest, NextResponse } from 'next/server';
import efipay from '@/lib/efi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { valor, nome, cpf, email, cep, rua, numero, bairro, cidade, estado, descricao } = body;

    const chargeBody = {
      items: [{
        name: descricao || 'Pagamento Finora',
        value: Math.round(Number(valor) * 100),
        amount: 1,
      }],
      customer: {
        name: nome,
        cpf: cpf.replace(/\D/g, ''),
        email,
        birth: '1990-01-01',
        phone_number: '11999999999',
        address: {
          street: rua,
          number: numero,
          neighborhood: bairro,
          zipcode: cep.replace(/\D/g, ''),
          city: cidade,
          state: estado,
        },
      },
      expire_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    const charge = await efipay.createOneStepCharge([], chargeBody);

    return NextResponse.json({
      chargeId: charge.data.charge_id,
      boletoUrl: charge.data.payment.banking_billet.link,
      barcode: charge.data.payment.banking_billet.barcode,
      status: charge.data.status,
    });
  } catch (error: any) {
    console.error('Erro Boleto Efi:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar boleto' }, { status: 500 });
  }
}