import { NextRequest, NextResponse } from 'next/server';
import efipay from '@/lib/efi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { valor, nome, cpf, email, parcelas, paymentToken, descricao } = body;

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
      },
      payment: {
        credit_card: {
          installments: parcelas || 1,
          payment_token: paymentToken,
          billing_address: {
            street: 'Rua Exemplo',
            number: '123',
            neighborhood: 'Centro',
            zipcode: '00000000',
            city: 'Cidade',
            state: 'MG',
          },
        },
      },
    };

    const charge = await efipay.createOneStepCharge([], chargeBody);

    return NextResponse.json({
      chargeId: charge.data.charge_id,
      status: charge.data.status,
      parcelas: charge.data.payment.credit_card.installments,
    });
  } catch (error: any) {
    console.error('Erro Cartão Efi:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar cartão' }, { status: 500 });
  }
}