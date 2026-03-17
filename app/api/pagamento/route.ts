import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPicPayToken } from '@/lib/picpay-token';
import { enviarEmailPedidoCriado } from '@/lib/email';
import { HttpsProxyAgent } from 'https-proxy-agent';

const PAGGPIX_TOKEN = process.env.PAGGPIX_TOKEN;
const PAGGPIX_API = 'https://public-api.paggpix.com';
const PICPAY_API = 'https://checkout-api.picpay.com';
const APPMAX_API = 'https://app.appmax.com.br/api/v3';
const APPMAX_TOKEN = process.env.APPMAX_ACCESS_TOKEN;
const VENIT_API = 'https://api.venitip.com.br/functions/v1';
const VENIT_SECRET = process.env.VENIT_SECRET_KEY || '';
const VENIT_COMPANY = process.env.VENIT_COMPANY_ID || '';
const VENIT_AUTH = 'Basic ' + Buffer.from(VENIT_SECRET + ':' + VENIT_COMPANY).toString('base64');
const CIELO_API = 'https://api.cieloecommerce.cielo.com.br/1';
const CIELO_MERCHANT_ID = process.env.CIELO_MERCHANT_ID || '';
const CIELO_MERCHANT_KEY = process.env.CIELO_MERCHANT_KEY || '';
const FIXIE_URL = process.env.FIXIE_URL || '';
const appmaxAgent = FIXIE_URL ? new HttpsProxyAgent(FIXIE_URL) : undefined;

console.log('Venit auth montado - Secret:', VENIT_SECRET.substring(0, 10) + '... | Company:', VENIT_COMPANY.substring(0, 8) + '...');
console.log('Fixie proxy:', FIXIE_URL ? '✅ configurado' : '❌ não configurado');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planoId, compradorNome, compradorEmail, compradorCpf, compradorTel, cep, rua, numero, complemento, bairro, cidade, estado, metodoPagamento, orderBumpIds } = body;

    const plano = await prisma.planoOferta.findUnique({
      where: { id: planoId },
      include: { produto: true }
    });

    if (!plano || !plano.ativo) {
      return NextResponse.json({ error: 'Plano não encontrado ou inativo' }, { status: 404 });
    }

    let valorTotal = plano.preco;
    let orderBumpsNomes: string[] = [];
    let orderBumpsValor = 0;

    if (orderBumpIds && orderBumpIds.length > 0) {
      const obs = await prisma.orderBump.findMany({ where: { id: { in: orderBumpIds } } });
      orderBumpsValor = obs.reduce((acc: number, ob: any) => acc + ob.preco, 0);
      orderBumpsNomes = obs.map((ob: any) => `${ob.titulo} (R$ ${ob.preco.toFixed(2).replace('.', ',')})`);
      valorTotal += orderBumpsValor;
    }

    const configPix = await prisma.configuracaoGateway.findUnique({ where: { metodo: 'PIX' } });
    const configBoleto = await prisma.configuracaoGateway.findUnique({ where: { metodo: 'BOLETO' } });
    const configCartao = await prisma.configuracaoGateway.findUnique({ where: { metodo: 'CARTAO' } });
    const gatewayPix = configPix?.gateway || 'PAGGPIX';
    const gatewayBoleto = configBoleto?.gateway || 'MERCADOPAGO';
    const gatewayCartao = configCartao?.gateway || 'PICPAY';

    console.log(`🔧 Gateway PIX: ${gatewayPix} | Boleto: ${gatewayBoleto} | Cartão: ${gatewayCartao}`);

    const venda = await prisma.venda.create({
      data: {
        valor: valorTotal,
        status: 'PENDENTE',
        metodoPagamento: metodoPagamento || 'PIX',
        compradorNome, compradorEmail, compradorCpf, compradorTel,
        cep, rua, numero, complemento, bairro, cidade, estado,
        nomePlano: plano.nome,
        orderBumpsIds: orderBumpIds || [],
        orderBumpsNomes, orderBumpsValor,
        produtoId: plano.produtoId,
        vendedorId: plano.produto.userId,
        utmSource: body.utmSource || null,
        utmMedium: body.utmMedium || null,
        utmCampaign: body.utmCampaign || null,
      }
    });

    console.log('✅ Venda criada:', venda.id);

    let pixId = null;
    let qrCode = null;
    let copiaECola = null;

    // ==========================================
    // PIX
    // ==========================================
    if (metodoPagamento === 'PIX') {

      if (gatewayPix === 'PICPAY') {
        console.log('💚 Gerando PIX via PicPay...');
        const token = await getPicPayToken();
        const valorCentavos = Math.round(plano.preco * 100);
        const telLimpo = compradorTel?.replace(/\D/g, '') || '11999999999';
        const areaCode = telLimpo.substring(0, 2);
        const number = telLimpo.substring(2);
        const merchantChargeId = venda.id.replace(/[^a-zA-Z0-9-]/g, '').substring(0, 36);

        const picpayBody = {
          paymentSource: 'GATEWAY',
          merchantChargeId,
          customer: {
            name: compradorNome,
            email: compradorEmail || 'contato@finorapayments.com',
            documentType: (compradorCpf?.replace(/\D/g, '').length === 14) ? 'CNPJ' : 'CPF',
            document: compradorCpf?.replace(/\D/g, '') || '00000000000',
            phone: { countryCode: '55', areaCode, number, type: 'MOBILE' }
          },
          transactions: [{ amount: valorCentavos, pix: { expiration: 3600 } }]
        };

        const picpayResponse = await fetch(`${PICPAY_API}/api/v1/charge/pix`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(picpayBody)
        });

        const picpayText = await picpayResponse.text();
        console.log('📥 Resposta PicPay PIX:', picpayText);

        if (!picpayResponse.ok) {
          return NextResponse.json({ error: 'Erro ao gerar PIX via PicPay', details: picpayText }, { status: 500 });
        }

        const picpayResult = JSON.parse(picpayText);
        const pixData = picpayResult.transactions?.[0]?.pix;
        if (!pixData) return NextResponse.json({ error: 'Erro ao obter QR Code PIX do PicPay' }, { status: 500 });

        const chargeId = picpayResult.id || picpayResult.merchantChargeId;
        await prisma.venda.update({ where: { id: venda.id }, data: { pixId: chargeId, pixQrCode: pixData.qrCodeBase64, pixCopiaECola: pixData.qrCode } });
        pixId = chargeId; qrCode = pixData.qrCodeBase64; copiaECola = pixData.qrCode;

      } else if (gatewayPix === 'MERCADOPAGO') {
        console.log('🟢 Gerando PIX via Mercado Pago...');
        const { MercadoPagoConfig, Payment } = require('mercadopago');
        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' });
        const paymentMP = new Payment(client);

        const result = await paymentMP.create({
          body: {
            transaction_amount: valorTotal,
            description: `${plano.nome} - ${plano.produto.nome}`,
            payment_method_id: 'pix',
            payer: {
              email: compradorEmail || 'contato@finorapayments.com',
              first_name: compradorNome.split(' ')[0],
              last_name: compradorNome.split(' ').slice(1).join(' ') || compradorNome.split(' ')[0],
              identification: { type: (compradorCpf?.replace(/\D/g, '').length === 11) ? 'CPF' : 'CNPJ', number: compradorCpf?.replace(/\D/g, '') || '00000000000' }
            },
            external_reference: venda.id
          }
        });

        const pixDataMP = result.point_of_interaction?.transaction_data;
        if (pixDataMP) {
          await prisma.venda.update({ where: { id: venda.id }, data: { pixQrCode: pixDataMP.qr_code_base64 || null, pixCopiaECola: pixDataMP.qr_code || null, pixId: String(result.id) } });
          qrCode = pixDataMP.qr_code_base64; copiaECola = pixDataMP.qr_code; pixId = String(result.id);
        } else {
          return NextResponse.json({ error: 'Erro ao gerar PIX via Mercado Pago' }, { status: 500 });
        }

      } else if (gatewayPix === 'VENIT') {
        console.log('💜 Gerando PIX via Venit...');
        const valorCentavos = Math.round(valorTotal * 100);
        const telLimpo = compradorTel?.replace(/\D/g, '') || '11999999999';

        const venitBody = {
          paymentMethod: 'PIX', amount: valorCentavos,
          description: plano.nome + ' - ' + plano.produto.nome,
          externalRef: venda.id,
          postbackUrl: 'https://finorapayments.com/api/webhook/venit',
          ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
          customer: {
            name: compradorNome, email: compradorEmail || 'contato@finorapayments.com', phone: telLimpo,
            document: { type: 'CPF', number: compradorCpf?.replace(/\D/g, '') || '00000000000' },
            address: { street: rua || 'Rua', streetNumber: numero || 'SN', complement: complemento || '', zipCode: cep?.replace(/\D/g, '') || '01001000', neighborhood: bairro || 'Centro', city: cidade || 'Sao Paulo', state: estado || 'SP', country: 'BR' }
          },
          items: [{ title: plano.nome, unitPrice: valorCentavos, quantity: 1, externalRef: plano.id.substring(0, 50) }],
          pix: { expiresInMinutes: 60 }
        };

        const venitRes = await fetch(VENIT_API + '/transactions/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'authorization': VENIT_AUTH, 'x-api-key': VENIT_SECRET },
          body: JSON.stringify(venitBody)
        });

        const venitText = await venitRes.text();
        console.log('Venit resposta COMPLETA:', venitText);
        if (!venitRes.ok) return NextResponse.json({ error: 'Erro ao gerar PIX via Venit', details: venitText }, { status: 500 });

        const venitResult = JSON.parse(venitText);
        const pixVenit = venitResult.pix;
        if (!pixVenit?.qrcode) return NextResponse.json({ error: 'Erro ao obter QR Code Venit' }, { status: 500 });

        await prisma.venda.update({ where: { id: venda.id }, data: { pixId: venitResult.id, pixCopiaECola: pixVenit.qrcode, pixQrCode: null } });
        pixId = venitResult.id; copiaECola = pixVenit.qrcode; qrCode = null;
        console.log('Venit PIX gerado com sucesso! ID:', venitResult.id);

      } else if (gatewayPix === 'EFI') {
        console.log('🟢 Gerando PIX via Efi Bank...');
        const efiRes = await fetch(`${request.nextUrl.origin}/api/efi/pix`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor: valorTotal, nome: compradorNome, cpf: compradorCpf, descricao: plano.nome })
        });
        const efiData = await efiRes.json();
        if (!efiRes.ok) return NextResponse.json({ error: 'Erro ao gerar PIX Efi', details: efiData }, { status: 500 });
        await prisma.venda.update({ where: { id: venda.id }, data: { pixTxid: efiData.txid, pixQrCode: efiData.qrCodeImagem, pixCopiaECola: efiData.pixCopiaECola } });
        pixId = efiData.txid; qrCode = efiData.qrCodeImagem; copiaECola = efiData.pixCopiaECola;

      } else {
        // PaggPix (padrão)
        const paggpixData = { cnpj: "35254464000109", value: valorTotal.toFixed(2), description: `${plano.nome} - ${plano.produto.nome}`, external_id: venda.id };
        const paggpixResponse = await fetch(`${PAGGPIX_API}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${PAGGPIX_TOKEN}` },
          body: JSON.stringify(paggpixData)
        });

        const responseText = await paggpixResponse.text();
        if (!paggpixResponse.ok) return NextResponse.json({ error: 'Erro ao criar cobrança PIX', details: responseText }, { status: 500 });

        const paggpixResult = JSON.parse(responseText);
        await prisma.venda.update({ where: { id: venda.id }, data: { pixId: paggpixResult.pix_id, pixQrCode: paggpixResult.qrcode_image, pixCopiaECola: paggpixResult.pix_code } });
        pixId = paggpixResult.pix_id; qrCode = paggpixResult.qrcode_image; copiaECola = paggpixResult.pix_code;
      }

    // ==========================================
    // CARTÃO
    // ==========================================
    } else if (metodoPagamento === 'CARTAO') {

      if (gatewayCartao === 'CIELO') {
        console.log('💳 Gerando cartão via Cielo...');
        const { cartaoNumero, cartaoCvv, cartaoMes, cartaoAno, cartaoNome, parcelas } = body;
        const valorCentavos = Math.round(valorTotal * 100);
        const anoFormatado = cartaoAno?.length === 2 ? '20' + cartaoAno : cartaoAno;

        const cieloBody = {
          MerchantOrderId: venda.id,
          Customer: {
            Name: compradorNome,
            Email: compradorEmail || 'contato@finorapayments.com',
            Identity: compradorCpf?.replace(/\D/g, '') || '00000000000',
            IdentityType: 'CPF'
          },
          Payment: {
            Type: 'CreditCard',
            Amount: valorCentavos,
            Installments: parseInt(parcelas) || 1,
            SoftDescriptor: 'FINORA',
            Capture: true,
            CreditCard: {
              CardNumber: cartaoNumero?.replace(/\D/g, ''),
              Holder: cartaoNome || compradorNome,
              ExpirationDate: `${cartaoMes}/${anoFormatado}`,
              SecurityCode: cartaoCvv,
              Brand: detectarBandeira(cartaoNumero?.replace(/\D/g, '') || '')
            }
          }
        };

        const cieloRes = await fetch(`${CIELO_API}/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'MerchantId': CIELO_MERCHANT_ID, 'MerchantKey': CIELO_MERCHANT_KEY },
          body: JSON.stringify(cieloBody)
        });

        const cieloText = await cieloRes.text();
        console.log('Cielo resposta:', cieloText);

        if (!cieloRes.ok) {
          return NextResponse.json({ error: 'Erro ao processar cartão Cielo', details: cieloText }, { status: 500 });
        }

        const cieloResult = JSON.parse(cieloText);
        const paymentStatus = cieloResult.Payment?.Status;
        const paymentId = cieloResult.Payment?.PaymentId;
        const returnCode = cieloResult.Payment?.ReturnCode;
        const returnMessage = cieloResult.Payment?.ReturnMessage;

        console.log('Cielo status:', paymentStatus, '| ReturnCode:', returnCode, '| Message:', returnMessage);

        if (paymentStatus === 2) {
          await prisma.venda.update({ where: { id: venda.id }, data: { status: 'PAGO', pixId: paymentId } });
          try {
            const pixels = await (prisma as any).pixel.findMany({ where: { produtoId: plano.produtoId, plataforma: 'FACEBOOK', ativo: true } });
            for (const px of pixels) {
              if (px.pixelId && px.accessToken) {
                const { dispararEventoCAPI } = await import('@/lib/facebook-capi');
                await dispararEventoCAPI({ pixelId: px.pixelId, accessToken: px.accessToken, eventName: 'Purchase', value: valorTotal, contentName: plano.nome, contentIds: [plano.produtoId], email: compradorEmail, phone: compradorTel });
              }
            }
          } catch (e) { console.error('Erro CAPI Purchase Cielo:', e); }
        } else if (paymentStatus === 1) {
          await prisma.venda.update({ where: { id: venda.id }, data: { status: 'PENDENTE', pixId: paymentId } });
        } else {
          return NextResponse.json({ error: `Cartão recusado: ${returnMessage || 'Transação não autorizada'}`, returnCode }, { status: 400 });
        }

      } else if (gatewayCartao === 'APPMAX') {
        console.log('💳 Gerando cartao via Appmax (proxy Fixie)...');
        const { cartaoNumero, cartaoCvv, cartaoMes, cartaoAno, cartaoNome, parcelas } = body;
        const nomePartes = compradorNome.split(' ');
        const firstname = nomePartes[0];
        const lastname = nomePartes.slice(1).join(' ') || firstname;

        // 1. Criar cliente
        const customerRes = await fetch(APPMAX_API + '/customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Origin': 'https://finorapayments.com',
            'Referer': 'https://finorapayments.com/'
          },
          body: JSON.stringify({ 'access-token': APPMAX_TOKEN, firstname, lastname, email: compradorEmail, telephone: compradorTel?.replace(/\D/g, '') || '11999999999', postcode: cep?.replace(/\D/g, '') || '', address_street: rua || 'Rua', address_street_number: numero || 'SN', address_street_complement: complemento || '', address_street_district: bairro || 'Centro', address_city: cidade || 'Sao Paulo', address_state: estado || 'SP', ip: request.headers.get('x-forwarded-for') || '127.0.0.1' }),
          ...(appmaxAgent && { agent: appmaxAgent } as any)
        });

        const customerText = await customerRes.text();
        console.log('Appmax customer resposta:', customerText);
        let customerData: any = {};
        try { customerData = JSON.parse(customerText); } catch(e) { return NextResponse.json({ error: 'Appmax retornou resposta invalida', details: customerText.substring(0, 200) }, { status: 500 }); }
        if (!customerRes.ok || !customerData.data?.id) return NextResponse.json({ error: 'Erro ao criar cliente Appmax', details: customerData }, { status: 500 });
        const customerId = customerData.data.id;

        // 2. Criar pedido
        const orderRes = await fetch(APPMAX_API + '/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Origin': 'https://finorapayments.com',
            'Referer': 'https://finorapayments.com/'
          },
          body: JSON.stringify({ 'access-token': APPMAX_TOKEN, customer_id: customerId, total: valorTotal, products: [{ sku: plano.id.substring(0, 20), name: plano.nome, qty: 1 }] }),
          ...(appmaxAgent && { agent: appmaxAgent } as any)
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok || !orderData.data?.id) return NextResponse.json({ error: 'Erro ao criar pedido Appmax', details: orderData }, { status: 500 });
        const orderId = orderData.data.id;

        // 3. Processar cartão
        const cartaoRes = await fetch(APPMAX_API + '/payment/credit-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Origin': 'https://finorapayments.com',
            'Referer': 'https://finorapayments.com/'
          },
          body: JSON.stringify({ 'access-token': APPMAX_TOKEN, cart: { order_id: orderId }, customer: { customer_id: customerId }, payment: { CreditCard: { number: cartaoNumero?.replace(/\D/g, ''), cvv: cartaoCvv, month: parseInt(cartaoMes), year: parseInt(cartaoAno), document_number: compradorCpf?.replace(/\D/g, '') || '00000000000', name: cartaoNome || compradorNome, installments: parcelas || 1 } } }),
          ...(appmaxAgent && { agent: appmaxAgent } as any)
        });

        const cartaoData = await cartaoRes.json();
        console.log('Appmax cartao resposta:', JSON.stringify(cartaoData));
        if (!cartaoRes.ok) return NextResponse.json({ error: 'Erro ao processar cartao Appmax', details: cartaoData }, { status: 500 });
        const statusCartao = cartaoData.data?.status || 'pending';
        await prisma.venda.update({ where: { id: venda.id }, data: { status: statusCartao === 'approved' ? 'PAGO' : 'PENDENTE', pixId: String(orderId) } });

      } else if (gatewayCartao === 'EFI') {
        console.log('💳 Gerando cartão via Efi Bank...');
        const { cartaoNumero, cartaoCvv, cartaoMes, cartaoAno, cartaoNome, parcelas, efiToken } = body;
        console.log('EFI token no pagamento:', efiToken ? 'PRESENTE' : 'AUSENTE');
        const efiRes = await fetch(`${request.nextUrl.origin}/api/efi/cartao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor: valorTotal, nome: compradorNome, cpf: compradorCpf, email: compradorEmail, parcelas: parseInt(parcelas) || 1, efiToken, cartaoNome, descricao: plano.nome })
        });
        const efiData = await efiRes.json();
        if (!efiRes.ok) return NextResponse.json({ error: 'Erro ao processar cartão Efi', details: efiData }, { status: 500 });
        await prisma.venda.update({ where: { id: venda.id }, data: { status: efiData.status === 'paid' ? 'PAGO' : 'PENDENTE', efiChargeId: String(efiData.chargeId) } });

      } else if (gatewayCartao === 'EFI') {
        console.log('💳 Gerando cartão via Efi Bank...');
        const { cartaoNumero, cartaoCvv, cartaoMes, cartaoAno, cartaoNome, parcelas } = body;
        const efiRes = await fetch(`${request.nextUrl.origin}/api/efi/cartao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor: valorTotal, nome: compradorNome, cpf: compradorCpf, email: compradorEmail, parcelas: parseInt(parcelas) || 1, efiToken: body.efiToken, cartaoNome, descricao: plano.nome })
        });
        const efiData = await efiRes.json();
        if (!efiRes.ok) return NextResponse.json({ error: 'Erro ao processar cartão Efi', details: efiData }, { status: 500 });
        await prisma.venda.update({ where: { id: venda.id }, data: { status: efiData.status === 'paid' ? 'PAGO' : 'PENDENTE', efiChargeId: String(efiData.chargeId) } });

      } else {
        console.log('💳 Gerando cartao via Mercado Pago...');
        const { mpToken, parcelas } = body;
        if (!mpToken) return NextResponse.json({ error: 'Token do cartao nao fornecido' }, { status: 400 });

        const { MercadoPagoConfig, Payment } = require('mercadopago');
        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' });
        const paymentMP = new Payment(client);

        const result = await paymentMP.create({
          body: {
            transaction_amount: valorTotal,
            description: `${plano.nome} - ${plano.produto.nome}`,
            installments: parcelas || 1, token: mpToken,
            payer: { email: compradorEmail || 'contato@finorapayments.com', first_name: compradorNome.split(' ')[0], last_name: compradorNome.split(' ').slice(1).join(' ') || compradorNome.split(' ')[0], identification: { type: 'CPF', number: compradorCpf?.replace(/\D/g, '') || '00000000000' } },
            external_reference: venda.id
          }
        });

        console.log('MP cartao resposta:', result.status, result.status_detail);
        if (result.status === 'approved') {
          await prisma.venda.update({ where: { id: venda.id }, data: { status: 'PAGO', pixId: String(result.id) } });
        } else if (result.status === 'in_process' || result.status === 'pending') {
          await prisma.venda.update({ where: { id: venda.id }, data: { pixId: String(result.id) } });
        } else {
          return NextResponse.json({ error: 'Cartao recusado: ' + result.status_detail }, { status: 400 });
        }
      }

    // ==========================================
    // BOLETO
    // ==========================================
    } else if (metodoPagamento === 'BOLETO') {
      if (gatewayBoleto === 'APPMAX') {
        console.log('📄 Gerando boleto via Appmax (proxy Fixie)...');
        const nomePartes = compradorNome.split(' ');
        const firstname = nomePartes[0];
        const lastname = nomePartes.slice(1).join(' ') || firstname;

        // 1. Criar cliente
        const customerRes = await fetch(APPMAX_API + '/customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Origin': 'https://finorapayments.com',
            'Referer': 'https://finorapayments.com/'
          },
          body: JSON.stringify({ 'access-token': APPMAX_TOKEN, firstname, lastname, email: compradorEmail, telephone: compradorTel?.replace(/\D/g, '') || '11999999999', postcode: cep?.replace(/\D/g, '') || '', address_street: rua || 'Rua', address_street_number: numero || 'SN', address_street_complement: complemento || '', address_street_district: bairro || 'Centro', address_city: cidade || 'Sao Paulo', address_state: estado || 'SP', ip: request.headers.get('x-forwarded-for') || '127.0.0.1' }),
          ...(appmaxAgent && { agent: appmaxAgent } as any)
        });

        const customerData = await customerRes.json();
        if (!customerRes.ok || !customerData.data?.id) return NextResponse.json({ error: 'Erro ao criar cliente Appmax', details: customerData }, { status: 500 });
        const customerId = customerData.data.id;

        // 2. Criar pedido
        const orderRes = await fetch(APPMAX_API + '/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Origin': 'https://finorapayments.com',
            'Referer': 'https://finorapayments.com/'
          },
          body: JSON.stringify({ 'access-token': APPMAX_TOKEN, customer_id: customerId, total: valorTotal, products: [{ sku: plano.id.substring(0, 20), name: plano.nome, qty: 1 }] }),
          ...(appmaxAgent && { agent: appmaxAgent } as any)
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok || !orderData.data?.id) return NextResponse.json({ error: 'Erro ao criar pedido Appmax', details: orderData }, { status: 500 });
        const orderId = orderData.data.id;

        // 3. Gerar boleto
        const boletoRes = await fetch(APPMAX_API + '/payment/boleto', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Origin': 'https://finorapayments.com',
            'Referer': 'https://finorapayments.com/'
          },
          body: JSON.stringify({ 'access-token': APPMAX_TOKEN, cart: { order_id: orderId }, customer: { customer_id: customerId }, payment: { Boleto: { document_number: compradorCpf?.replace(/\D/g, '') || '00000000000' } } }),
          ...(appmaxAgent && { agent: appmaxAgent } as any)
        });

        const boletoData = await boletoRes.json();
        console.log('Appmax boleto resposta:', JSON.stringify(boletoData));
        if (!boletoRes.ok) return NextResponse.json({ error: 'Erro ao gerar boleto Appmax', details: boletoData }, { status: 500 });

        await prisma.venda.update({ where: { id: venda.id }, data: { boletoUrl: boletoData.data?.boleto_url || boletoData.data?.url || null, boletoBarcode: boletoData.data?.boleto_barcode || boletoData.data?.barcode || null, pixId: String(orderId) } });

      } else if (gatewayBoleto === 'EFI') {
        console.log('📄 Gerando boleto via Efi Bank...');
        const efiRes = await fetch(`${request.nextUrl.origin}/api/efi/boleto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor: valorTotal, nome: compradorNome, cpf: compradorCpf, email: compradorEmail, cep, rua, numero, bairro, cidade, estado, descricao: plano.nome })
        });
        const efiData = await efiRes.json();
        if (!efiRes.ok) return NextResponse.json({ error: 'Erro ao gerar boleto Efi', details: efiData }, { status: 500 });
        await prisma.venda.update({ where: { id: venda.id }, data: { boletoUrl: efiData.boletoUrl, boletoBarcode: efiData.barcode, efiChargeId: String(efiData.chargeId) } });

      } else {
        console.log('Gerando boleto via Mercado Pago...');
        const { MercadoPagoConfig, Payment } = require('mercadopago');
        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' });
        const paymentMP = new Payment(client);

        const result = await paymentMP.create({
          body: {
            transaction_amount: valorTotal,
            description: `${plano.nome} - ${plano.produto.nome}`,
            payment_method_id: 'bolbradesco',
            payer: {
              email: compradorEmail || 'contato@finorapayments.com',
              first_name: compradorNome.split(' ')[0],
              last_name: compradorNome.split(' ').slice(1).join(' ') || compradorNome.split(' ')[0],
              identification: { type: (compradorCpf?.replace(/\D/g, '').length === 11) ? 'CPF' : 'CNPJ', number: compradorCpf?.replace(/\D/g, '') || '00000000000' },
              address: { zip_code: cep?.replace(/\D/g, '') || '', street_name: rua || 'Rua', street_number: numero || 'SN', neighborhood: bairro || 'Centro', city: cidade || 'São Paulo', federal_unit: estado || 'SP' }
            },
            external_reference: venda.id
          }
        });

        if (result.status === 'pending' && result.transaction_details?.external_resource_url) {
          await prisma.venda.update({ where: { id: venda.id }, data: { boletoUrl: result.transaction_details.external_resource_url, boletoBarcode: result.barcode?.content || null } });
        } else {
          return NextResponse.json({ error: 'Erro ao gerar boleto', details: result.status_detail }, { status: 500 });
        }
      }
    }

    // Email
    try {
      await enviarEmailPedidoCriado({ compradorNome, compradorEmail, produtoNome: plano.produto.nome, planoNome: plano.nome, valor: plano.preco, metodoPagamento: metodoPagamento || 'PIX', pedidoId: venda.id });
    } catch (e) { console.error('Erro ao enviar email pedido criado:', e); }

    // CAPI AddPaymentInfo
    try {
      const pixelsProduto = await (prisma as any).pixel.findMany({ where: { produtoId: plano.produtoId, plataforma: 'FACEBOOK', ativo: true } });
      for (const px of pixelsProduto) {
        if (px.pixelId && px.accessToken) {
          const { dispararEventoCAPI } = await import('@/lib/facebook-capi');
          await dispararEventoCAPI({ pixelId: px.pixelId, accessToken: px.accessToken, eventName: 'AddPaymentInfo', value: valorTotal, contentName: plano.nome, contentIds: [plano.produtoId], email: compradorEmail, phone: compradorTel });
        }
      }
    } catch (e) { console.error('Erro CAPI AddPaymentInfo:', e); }

    // Telegram
    const produto = await prisma.produto.findUnique({
      where: { id: plano.produtoId },
      include: { user: { select: { id: true, nome: true, telegramBotToken: true, telegramChatId: true } } }
    });

    const statusPagamento = metodoPagamento === 'PIX' ? '🟢 PIX Gerado - Aguardando pagamento' : metodoPagamento === 'BOLETO' ? '🟡 Boleto Gerado - Aguardando pagamento' : '💳 Cartão - Processando';
    const mensagemVendaGerada = `🔔 <b>VENDA GERADA</b>\n\n💰 Valor: R$ ${venda.valor.toFixed(2)}\n👤 Cliente: ${venda.compradorNome}\n📧 Email: ${venda.compradorEmail}\n📦 Produto: ${plano.nome}\n💳 Pagamento: ${venda.metodoPagamento}\n${statusPagamento}\n🆔 Venda ID: ${venda.id.substring(0,8)}`;

    if (produto?.user?.telegramBotToken && produto?.user?.telegramChatId) {
      try {
        await fetch(`${request.nextUrl.origin}/api/telegram/notificar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ botToken: produto.user.telegramBotToken, chatId: produto.user.telegramChatId, mensagem: mensagemVendaGerada }) });
      } catch (e) { console.error('Erro notificação vendedor:', e); }
    }

    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        await fetch(`${request.nextUrl.origin}/api/telegram/notificar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ botToken: process.env.TELEGRAM_BOT_TOKEN, chatId: process.env.TELEGRAM_CHAT_ID, mensagem: mensagemVendaGerada + `\n\n🧑‍💼 Vendedor: ${produto?.user?.nome || 'N/A'}` }) });
      } catch (e) { console.error('Erro notificação geral:', e); }
    }

    return NextResponse.json({ vendaId: venda.id, pixId, qrCode, copiaECola, valor: plano.preco, metodoPagamento: venda.metodoPagamento });

  } catch (error: any) {
    console.error('Erro ao criar pagamento:', error);
    return NextResponse.json({ error: 'Erro ao processar pagamento', details: error.message }, { status: 500 });
  }
}

function detectarBandeira(numero: string): string {
  if (/^4/.test(numero)) return 'Visa';
  if (/^5[1-5]/.test(numero) || /^2(2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(numero)) return 'Master';
  if (/^3[47]/.test(numero)) return 'Amex';
  if (/^6(?:011|5)/.test(numero)) return 'Discover';
  if (/^(?:636368|438935|504175|451416|636297|5067|4576|4011)/.test(numero)) return 'Elo';
  if (/^3(?:0[0-5]|[68])/.test(numero)) return 'Diners';
  if (/^(?:35\d{3})/.test(numero)) return 'JCB';
  if (/^(606282|3841)/.test(numero)) return 'Hipercard';
  return 'Visa';
}