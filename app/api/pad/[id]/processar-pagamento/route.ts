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
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (pedido.status !== 'ENTREGUE' && pedido.status !== 'AGUARDANDO_ENVIO') {
      return NextResponse.json({ error: 'Este pedido não pode receber pagamento no momento' }, { status: 400 });
    }

    if (pedido.vendaId) {
      return NextResponse.json({ error: 'Este pedido já foi pago' }, { status: 400 });
    }

    // Buscar configuração de gateway
    const configPix = await prisma.configuracaoGateway.findUnique({ where: { metodo: 'PIX' } });
    const gatewayPix = configPix?.gateway || 'PAGGPIX';
    console.log(`🔧 Gateway PIX configurado: ${gatewayPix}`);

    // ========== PIX ==========
    if (metodoPagamento === 'PIX') {
      try {

        if (gatewayPix === 'MERCADOPAGO') {
          // PIX via Mercado Pago
          console.log('🟢 Gerando PIX PAD via Mercado Pago...');

          const result = await payment.create({
            body: {
              transaction_amount: pedido.valor,
              description: `PAD - ${pedido.produtoNome}`,
              payment_method_id: 'pix',
              payer: {
                email: pedido.clienteEmail || 'contato@finorapayments.com',
                first_name: pedido.clienteNome.split(' ')[0],
                last_name: pedido.clienteNome.split(' ').slice(1).join(' ') || pedido.clienteNome.split(' ')[0],
                identification: {
                  type: pedido.clienteCpfCnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ',
                  number: pedido.clienteCpfCnpj.replace(/\D/g, '')
                }
              },
              external_reference: pedido.id
            }
          });

          console.log('📥 Resultado MP PIX:', JSON.stringify(result, null, 2));

          const pixData = result.point_of_interaction?.transaction_data;
          if (!pixData) {
            return NextResponse.json({ error: 'Erro ao gerar PIX via Mercado Pago' }, { status: 500 });
          }

          const pedidoAtualizado = await prisma.pedidoPAD.update({
            where: { id: pedido.id },
            data: {
              pixQrCode: pixData.qr_code_base64 || null,
              pixCopiaECola: pixData.qr_code || null,
              pixId: String(result.id)
            }
          });

          return NextResponse.json({
            success: true,
            metodoPagamento: 'PIX',
            qrCode: pixData.qr_code_base64,
            copiaECola: pixData.qr_code,
            pedido: pedidoAtualizado
          });

        } else {
          // PIX via PaggPix (padrão)
          console.log('🟢 Gerando PIX PAD via PaggPix...');

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
            return NextResponse.json({ error: 'Erro ao gerar PIX' }, { status: 500 });
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
        }

      } catch (error: any) {
        console.error('❌ Erro PIX:', error);
        return NextResponse.json({ error: 'Erro ao processar PIX', details: error.message }, { status: 500 });
      }
    }

    // ========== CARTÃO (Mercado Pago) ==========
    if (metodoPagamento === 'CARTAO') {
      try {
        if (!dadosCartao || !dadosCartao.token) {
          return NextResponse.json({ error: 'Dados do cartão inválidos' }, { status: 400 });
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
              type: pedido.clienteCpfCnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ',
              number: pedido.clienteCpfCnpj.replace(/\D/g, '')
            }
          },
          external_reference: pedido.id
        };

        console.log('🚀 Enviando para Mercado Pago:', JSON.stringify(paymentData, null, 2));

        const result = await payment.create({ body: paymentData });

        console.log('✅ Resultado do Mercado Pago - Status:', result.status);

        if (result.status === 'approved') {
          console.log('✅ Pagamento APROVADO! Criando venda...');

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

          console.log('✅ Venda criada:', venda.id);

          try {
            const aprovacaoResponse = await fetch(`${request.nextUrl.origin}/api/pad/processar-aprovacao`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pedidoPadHash: pedido.hash, vendaId: venda.id })
            });

            if (!aprovacaoResponse.ok) {
              const errorData = await aprovacaoResponse.json();
              console.error('❌ Erro em processar-aprovacao:', errorData);
            } else {
              console.log('✅ Aprovação processada com sucesso!');
            }
          } catch (err) {
            console.error('❌ Erro ao chamar processar-aprovacao:', err);
          }

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
        return NextResponse.json({ error: 'Erro ao processar cartão', details: error.message }, { status: 500 });
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
            last_name: pedido.clienteNome.split(' ').slice(1).join(' ') || pedido.clienteNome.split(' ')[0],
            identification: {
              type: pedido.clienteCpfCnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ',
              number: pedido.clienteCpfCnpj.replace(/\D/g, '')
            },
            address: {
              zip_code: pedido.cep.replace(/\D/g, ''),
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

        if (result.status === 'pending' && result.transaction_details?.external_resource_url) {
          await prisma.pedidoPAD.update({
            where: { id: pedido.id },
            data: {
              boletoUrl: result.transaction_details.external_resource_url,
              boletoBarcode: result.barcode?.content || null
            }
          });

          return NextResponse.json({
            success: true,
            metodoPagamento: 'BOLETO',
            boletoUrl: result.transaction_details.external_resource_url,
            boletoBarcode: result.barcode?.content,
            status: result.status,
            transacaoId: result.id
          });
        } else {
          return NextResponse.json({
            success: false,
            metodoPagamento: 'BOLETO',
            message: 'Erro ao gerar boleto',
            details: result
          }, { status: 400 });
        }

      } catch (error: any) {
        console.error('❌ Erro Boleto:', error);
        return NextResponse.json({ error: 'Erro ao processar boleto', details: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Método de pagamento inválido' }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ error: 'Erro ao processar pagamento', details: error.message }, { status: 500 });
  }
}