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

    // Buscar configurações de gateway
    const configPix = await prisma.configuracaoGateway.findUnique({ where: { metodo: 'PIX' } });
    const configCartao = await prisma.configuracaoGateway.findUnique({ where: { metodo: 'CARTAO' } });
    const configBoleto = await prisma.configuracaoGateway.findUnique({ where: { metodo: 'BOLETO' } });

    const gatewayPix = configPix?.gateway || 'PAGGPIX';
    const gatewayCartao = configCartao?.gateway || 'MERCADOPAGO';
    const gatewayBoleto = configBoleto?.gateway || 'MERCADOPAGO';

    console.log(`🔧 Gateways: PIX=${gatewayPix} | CARTAO=${gatewayCartao} | BOLETO=${gatewayBoleto}`);

    // ========== PIX ==========
    if (metodoPagamento === 'PIX') {
      try {
        if (gatewayPix === 'MERCADOPAGO') {
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
          if (!paggpixResponse.ok) {
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

    // ========== CARTÃO ==========
    if (metodoPagamento === 'CARTAO') {
      try {
        if (gatewayCartao === 'EFI') {
          console.log('🟢 Processando CARTÃO PAD via Efi...');

          if (!dadosCartao || !dadosCartao.token) {
            return NextResponse.json({ error: 'Dados do cartão inválidos' }, { status: 400 });
          }

          const EfiPay = require('sdk-node-apis-efi');
          const options = {
            sandbox: false,
            client_id: process.env.EFI_CLIENT_ID,
            client_secret: process.env.EFI_CLIENT_SECRET,
            certificate: process.env.EFI_CERTIFICATE_PATH || './certificado.p12',
            cert_base64: process.env.EFI_CERTIFICATE_BASE64
          };
          const efipay = new EfiPay(options);

          const cpfCnpj = pedido.clienteCpfCnpj.replace(/\D/g, '');
          const efiBody = {
            payment: {
              credit_card: {
                installments: parseInt(dadosCartao.parcelas) || 1,
                payment_token: dadosCartao.token,
                billing_address: {
                  street: pedido.rua,
                  number: pedido.numero,
                  neighborhood: pedido.bairro,
                  zipcode: pedido.cep.replace(/\D/g, ''),
                  city: pedido.cidade,
                  complement: pedido.complemento || '',
                  state: pedido.estado
                },
                customer: {
                  name: pedido.clienteNome,
                  email: pedido.clienteEmail || 'contato@finorapayments.com',
                  cpf: cpfCnpj.length === 11 ? cpfCnpj : undefined,
                  cnpj: cpfCnpj.length === 14 ? cpfCnpj : undefined,
                  phone_number: pedido.clienteTelefone?.replace(/\D/g, '') || '11999999999'
                }
              }
            },
            items: [{
              name: pedido.produtoNome,
              value: Math.round(pedido.valor * 100),
              amount: 1
            }],
            metadata: { custom_id: pedido.id }
          };

          const efiResult = await efipay.createOneStepCharge({}, efiBody);
          console.log('📥 Resultado Efi Cartão:', JSON.stringify(efiResult, null, 2));

          if (efiResult.data?.status === 'approved') {
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

            await fetch(`${request.nextUrl.origin}/api/pad/processar-aprovacao`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pedidoPadHash: pedido.hash, vendaId: venda.id })
            });

            return NextResponse.json({
              success: true,
              metodoPagamento: 'CARTAO',
              status: 'approved',
              transacaoId: efiResult.data?.charge_id
            });
          } else {
            return NextResponse.json({
              success: false,
              metodoPagamento: 'CARTAO',
              status: efiResult.data?.status || 'failed',
              message: 'Pagamento não aprovado'
            });
          }

        } else {
          // Cartão via Mercado Pago (padrão)
          console.log('🟢 Processando CARTÃO PAD via Mercado Pago...');

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

          const result = await payment.create({ body: paymentData });

          if (result.status === 'approved') {
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

            await fetch(`${request.nextUrl.origin}/api/pad/processar-aprovacao`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pedidoPadHash: pedido.hash, vendaId: venda.id })
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
        }

      } catch (error: any) {
        console.error('❌ Erro Cartão:', error);
        return NextResponse.json({ error: 'Erro ao processar cartão', details: error.message }, { status: 500 });
      }
    }

    // ========== BOLETO ==========
    if (metodoPagamento === 'BOLETO') {
      try {
        if (gatewayBoleto === 'EFI') {
          console.log('🟢 Gerando BOLETO PAD via Efi...');

          const EfiPay = require('sdk-node-apis-efi');
          const options = {
            sandbox: false,
            client_id: process.env.EFI_CLIENT_ID,
            client_secret: process.env.EFI_CLIENT_SECRET,
            certificate: process.env.EFI_CERTIFICATE_PATH || './certificado.p12',
            cert_base64: process.env.EFI_CERTIFICATE_BASE64
          };
          const efipay = new EfiPay(options);

          const vencimento = new Date();
          vencimento.setDate(vencimento.getDate() + 3);
          const vencimentoStr = vencimento.toISOString().split('T')[0];

          const cpfCnpj = pedido.clienteCpfCnpj.replace(/\D/g, '');
          const efiBody = {
            items: [{
              name: pedido.produtoNome,
              value: Math.round(pedido.valor * 100),
              amount: 1
            }],
            customer: {
              name: pedido.clienteNome,
              cpf: cpfCnpj.length === 11 ? cpfCnpj : undefined,
              cnpj: cpfCnpj.length === 14 ? cpfCnpj : undefined,
              email: pedido.clienteEmail || 'contato@finorapayments.com',
              phone_number: pedido.clienteTelefone?.replace(/\D/g, '') || '11999999999'
            },
            expire_at: vencimentoStr,
            metadata: { custom_id: pedido.id }
          };

          const efiResult = await efipay.createOneStepCharge({}, efiBody);
          console.log('📥 Resultado Efi Boleto:', JSON.stringify(efiResult, null, 2));

          const boletoUrl = efiResult.data?.link || efiResult.data?.pdf?.charge || null;
          const boletoBarcode = efiResult.data?.barcode || null;
          const chargeId = efiResult.data?.charge_id || null;

          await prisma.pedidoPAD.update({
            where: { id: pedido.id },
            data: {
              boletoUrl,
              boletoBarcode,
              pixId: chargeId ? String(chargeId) : undefined
            }
          });

          return NextResponse.json({
            success: true,
            metodoPagamento: 'BOLETO',
            boletoUrl,
            boletoBarcode,
            status: 'pending',
            transacaoId: chargeId
          });

        } else {
          // Boleto via Mercado Pago (padrão)
          console.log('🟢 Gerando BOLETO PAD via Mercado Pago...');

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