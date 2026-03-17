import { NextRequest, NextResponse } from 'next/server';
import efipay from '@/lib/efi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { valor, nome, cpf, email, parcelas, efiToken, cartaoNome, descricao } = body;

    console.log('EFI cartao - token:', efiToken ? 'PRESENTE' : 'AUSENTE');
    const nomeCompleto = nome.trim().includes(' ') ? nome.trim() : nome.trim() + ' Pagador';

    const chargeBody = {
      items: [{
        name: descricao || 'Pagamento Finora',
        value: Math.round(Number(valor) * 100),
        amount: 1,
      }],
      payment: {
        credit_card: {
          customer: {
            name: nomeCompleto,
            cpf: cpf.replace(/\D/g, ''),
            email: email || 'contato@finorapayments.com',
            birth: '1990-01-01',
            phone_number: '11999999999',
            billing_address: {
              street: 'Rua Exemplo',
              number: '123',
              neighborhood: 'Centro',
              zipcode: '01001000',
              city: 'Sao Paulo',
              complement: '',
              state: 'SP',
            },
          },
          installments: parseInt(parcelas) || 1,
          payment_token: efiToken,
        },
      },
    };

    console.log('EFI chargeBody:', JSON.stringify(chargeBody));

    const charge = await efipay.createOneStepCharge([], chargeBody);

    return NextResponse.json({
      chargeId: charge.data.charge_id,
      status: charge.data.status,
    });
  } catch (error: any) {
    console.error('Erro Cartão Efi:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar cartão' }, { status: 500 });
  }
}