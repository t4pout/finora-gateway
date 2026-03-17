import { NextRequest, NextResponse } from 'next/server';
import efipay from '@/lib/efi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { valor, nome, cpf, email, cep, rua, numero, bairro, cidade, estado, descricao } = body;

    const nomeCompleto = nome.trim().includes(' ') ? nome.trim() : nome.trim() + ' Pagador';
    const expireAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const chargeBody = {
      items: [{
        name: descricao || 'Pagamento Finora',
        value: Math.round(Number(valor) * 100),
        amount: 1,
      }],
      payment: {
        banking_billet: {
          customer: {
            name: nomeCompleto,
            cpf: cpf.replace(/\D/g, ''),
            email: email || 'contato@finorapayments.com',
            phone_number: '11999999999',
            address: {
              street: rua || 'Rua Exemplo',
              number: numero || '123',
              neighborhood: bairro || 'Centro',
              zipcode: (cep || '01001000').replace(/\D/g, ''),
              city: cidade || 'Sao Paulo',
              complement: '',
              state: estado || 'SP',
            },
          },
          expire_at: expireAt,
        },
      },
    };

    console.log('EFI boleto body:', JSON.stringify(chargeBody));

    const charge = await efipay.createOneStepCharge([], chargeBody);

    console.log('EFI boleto resposta:', JSON.stringify(charge.data));

    return NextResponse.json({
      chargeId: charge.data.charge_id,
      boletoUrl: charge.data.link || charge.data.billet_link || null,
      barcode: charge.data.barcode || null,
      status: charge.data.status,
    });
  } catch (error: any) {
    console.error('Erro Boleto Efi:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar boleto' }, { status: 500 });
  }
}