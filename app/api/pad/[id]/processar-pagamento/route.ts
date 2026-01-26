import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const PAGGPIX_TOKEN = process.env.PAGGPIX_TOKEN;
const PAGGPIX_API = 'https://public-api.paggpix.com';

// Configurar Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
});
const payment = new Payment(client);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { metodoPagamento, dadosCartao } = body;

    // Buscar pedido pelo hash
    const pedido = await prisma.pedidoPAD.findUnique({
      where: { hash: id }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o pedido pode receber pagamento
    if (pedido.status !== 'APROVADO' && pedido.status !== 'ENVIADO') {
      return NextResponse.json(
        { error: 'Este pedido não pode receber pagamento no momento' },
        { status: 400 }
      );
    }

    // Verificar se já foi pago
    if (pedido.status === 'PAGO') {
      return NextResponse.json(
        { error: 'Este pedido já foi pago' },
        { status: 400 }
      );
    }

    // ========== PIX (PaggPix) ==========
    if (metodoPagamento === 'PIX') {
      try {
        const paggpixData = {
          cnpj: "35254464000109",
          value: pedido.valor.toFixed(2),
          description: `PAD - ${pedido.produtoNome}`,
          external_id: pedido.id
        };

        const paggpixResponse = await fetch(`${PAGGPIX_API}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PAGGPIX_TOKEN}`
          },
          body: JSON.stringify(paggpixData)
        });

        const responseText = await paggpixResponse.text();
        console.log('📡 Resposta PaggPix:', responseText);

        if (!paggpixResponse.ok) {
          console.error('❌ Erro PaggPix:', responseText);
          return NextResponse.json(
            { error: 'Erro ao gerar PIX' },
            { status: 500 }
          );
        }

        const paggpixResult = JSON.parse(responseText);

        // Atualizar pedido com dados do PIX
        const pedidoAtualizado = await prisma.pedidoPAD.update({
          where: { id: pedido.id },
          data: {
            pixQrCode: paggpixResult.qrcode_image,
            pixCopiaECola: paggpixResult.pix_code,
            pixId: paggpixResult.pix_id
          }
        });

        return NextResponse.json({
          success: true,
          metodoPagamento: 'PIX',
          qrCode: paggpixResult.qrcode_image,
          copiaECola: paggpixResult.pix_code,
          pedido: pedidoAtualizado
        });

      } catch (error: any) {
        console.error('❌ Erro PIX:', error);
        return NextResponse.json(
          { error: 'Erro ao processar PIX', details: error.message },
          { status: 500 }
        );
      }
    }

    // ========== CARTÃO (Mercado Pago) ==========
    if (metodoPagamento === 'CARTAO') {
      try {
        if (!dadosCartao || !dadosCartao.token) {
          return NextResponse.json(
            { error: 'Dados do cartão inválidos' },
            { status: 400 }
          );
        }

        const paymentData = {
          transaction_amount: pedido.valor,
          token: dadosCartao.token,
          description: `PAD - ${pedido.produtoNome}`,
          installments: parseInt(dadosCartao.parcelas) || 1,
          payment_method_id: dadosCartao.paymentMethodId,
          payer: {
            email: pedido.clienteEmail || 'contato@finorapayments.com',
            identification: {
              type: pedido.clienteCpfCnpj.length === 11 ? 'CPF' : 'CNPJ',
              number: pedido.clienteCpfCnpj
            }
          },
          external_reference: pedido.id
        };

        const result = await payment.create({ body: paymentData });

        if (result.status === 'approved') {
          // Pagamento aprovado imediatamente
          await prisma.pedidoPAD.update({
            where: { id: pedido.id },
            data: {
              status: 'PAGO',
              dataPagamento: new Date()
            }
          });

          return NextResponse.json({
            success: true,
            metodoPagamento: 'CARTAO',
            status: 'APROVADO',
            transactionId: result.id
          });
        } else {
          return NextResponse.json({
            success: false,
            metodoPagamento: 'CARTAO',
            status: result.status,
            message: 'Pagamento não aprovado'
          });
        }

      } catch (error: any) {
        console.error('❌ Erro Cartão:', error);
        return NextResponse.json(
          { error: 'Erro ao processar cartão', details: error.message },
          { status: 500 }
        );
      }
    }

    // ========== BOLETO (Mercado Pago) ==========
    if (metodoPagamento === 'BOLETO') {
      try {
        const paymentData = {
          transaction_amount: pedido.valor,
          description: `PAD - ${pedido.produtoNome}`,
          payment_method_id: 'bolbradesco',
          payer: {
            email: pedido.clienteEmail || 'contato@finorapayments.com',
            first_name: pedido.clienteNome.split(' ')[0],
            last_name: pedido.clienteNome.split(' ').slice(1).join(' ') || 'Silva',
            identification: {
              type: pedido.clienteCpfCnpj.length === 11 ? 'CPF' : 'CNPJ',
              number: pedido.clienteCpfCnpj
            },
            address: {
              zip_code: pedido.cep,
              street_name: pedido.rua,
              street_number: pedido.numero,
              neighborhood: pedido.bairro,
              city: pedido.cidade,
              federal_unit: pedido.estado
            }
          },
          external_reference: pedido.id
        };

        const result = await payment.create({ body: paymentData });

        return NextResponse.json({
          success: true,
          metodoPagamento: 'BOLETO',
          boletoUrl: result.transaction_details?.external_resource_url,
          barcode: result.barcode?.content,
          transactionId: result.id
        });

      } catch (error: any) {
        console.error('❌ Erro Boleto:', error);
        return NextResponse.json(
          { error: 'Erro ao gerar boleto', details: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Método de pagamento inválido' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento', details: error.message },
      { status: 500 }
    );
  }
}