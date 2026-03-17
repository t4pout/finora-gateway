import { NextRequest, NextResponse } from 'next/server';
import efipay from '@/lib/efi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { valor, nome, cpf, email, parcelas, efiToken, cartaoNome, descricao } = body;
    console.log('EFI cartao body recebido:', JSON.stringify({ valor, nome, efiToken: efiToken ? 'PRESENTE' : 'AUSENTE', parcelas }));

    const params = {};

    const chargeBody = {
      items: [{
        name: descricao || 'Pagamento Finora',
        value: Math.round(Number(valor) * 100),
        amount: 1,
      }],
      customer: {
        name: nome,
        cpf: cpf.replace(/\D/g, ''),
        email: email || 'contato@finorapayments.com',
        birth: '1990-01-01',
        phone_number: '11999999999',
      },
      payment: {
        credit_card: {
          customer: {
            name: nome,
            cpf: cpf.replace(/\D/g, ''),
            email: email || 'contato@finorapayments.com',
            birth: '1990-01-01',
            phone_number: '11999999999',
          },
          installments: parcelas || 1,
          payment_token: efiToken,
          billing_address: {
            street: 'Rua Exemplo',
            number: '123',
            neighborhood: 'Centro',
            zipcode: '01001000',
            city: 'Sao Paulo',
            state: 'SP',
          },
        },
      },
    };

    const charge = await efipay.createOneStepCharge(params, chargeBody);

    return NextResponse.json({
      chargeId: charge.data.charge_id,
      status: charge.data.status,
    });
  } catch (error: any) {
    console.error('Erro Cartão Efi:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar cartão' }, { status: 500 });
  }
}