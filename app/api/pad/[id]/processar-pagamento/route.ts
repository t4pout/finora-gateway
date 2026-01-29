import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const PAGGPIX_TOKEN = process.env.PAGGPIX_TOKEN;
const PAGGPIX_API = 'https://public-api.paggpix.com';

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

    const pedido = await prisma.pedidoPAD.findUnique({
      where: { hash: id }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    if (pedido.status !== 'ENTREGUE') {
      return NextResponse.json(
        { error: 'Este pedido não pode receber pagamento no momento' },
        { status: 400 }
      );
    }

    if (pedido.vendaId) {
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
          // Criar registro de venda
          const venda = await prisma.venda.create({
            data: {
              valor: pedido.valor,
              status: 'PAGO',
              metodoPagamento: 'CARTAO',
              compradorNome: pedido.clienteNome,
              compradorEmail: pedido.clienteEmail || '',
              compradorCpf: pedido.clienteCpfCnpj,
              compradorTel: pedido.clienteTelefone,
              cep: pedido.cep,
              rua: pedido.rua,
              numero: pedido.numero,
              complemento: pedido.complemento,
              bairro: pedido.bairro,
              cidade: pedido.cidade,
              estado: pedido.estado,
              produtoId: pedido.produtoId,
              vendedorId: pedido.vendedorId
            }
          });

          // Processar aprovação e adicionar saldo na carteira
          await fetch(`${request.nextUrl.origin}/api/pad/processar-aprovacao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pedidoPadHash: pedido.hash,
              vendaId: venda.id
            })
          });

          await prisma.pedidoPAD.update({
            where: { id: pedido.id },
            data: {
              status: 'PAGO',
              dataPagamento: new Date(),
              vendaId: venda.id
            }
          });

          return NextResponse.json({
            success: true,
            metodoPagamento: 'CARTAO',
            status: result.status,
            transacaoId: result.id
          });
        } else {
          return NextResponse.json({
            success: false,
            metodoPagamento: 'CARTAO',
            status: result.status,
            statusDetail: result.status_detail,
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