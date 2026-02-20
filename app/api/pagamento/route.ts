import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PAGGPIX_TOKEN = process.env.PAGGPIX_TOKEN;
const PAGGPIX_API = 'https://public-api.paggpix.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planoId, compradorNome, compradorEmail, compradorCpf, compradorTel, cep, rua, numero, complemento, bairro, cidade, estado, metodoPagamento } = body;

    // Buscar plano e produto
    const plano = await prisma.planoOferta.findUnique({
      where: { id: planoId },
      include: { produto: true }
    });

    if (!plano || !plano.ativo) {
      return NextResponse.json({ error: 'Plano não encontrado ou inativo' }, { status: 404 });
    }

    // PRIMEIRO: Criar venda no banco
    const venda = await prisma.venda.create({
      data: {
        valor: plano.preco,
        status: 'PENDENTE',
        metodoPagamento: metodoPagamento || 'PIX',
        compradorNome,
        compradorEmail,
        compradorCpf,
        compradorTel,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        nomePlano: plano.nome,
        produtoId: plano.produtoId,
        vendedorId: plano.produto.userId
      }
    });

    console.log('✅ Venda criada:', venda);

    let pixId = null;
    let qrCode = null;
    let copiaECola = null;

    // SEGUNDO: Criar cobrança baseado no método de pagamento
    if (metodoPagamento === 'PIX') {
      const paggpixData = {
        cnpj: "35254464000109",
        value: plano.preco.toFixed(2),
        description: `${plano.nome} - ${plano.produto.nome}`,
        external_id: venda.id
      };

      console.log('Enviando para PaggPix:', paggpixData);

      const paggpixResponse = await fetch(`${PAGGPIX_API}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PAGGPIX_TOKEN}`
        },
        body: JSON.stringify(paggpixData)
      });

      const responseText = await paggpixResponse.text();
      console.log('Resposta PaggPix:', responseText);

      if (!paggpixResponse.ok) {
        console.error('Erro PaggPix:', responseText);
        return NextResponse.json({ 
          error: 'Erro ao criar cobrança PIX',
          details: responseText
        }, { status: 500 });
      }

      const paggpixResult = JSON.parse(responseText);

      // Atualizar venda com dados do PIX
      await prisma.venda.update({
        where: { id: venda.id },
        data: {
          pixId: paggpixResult.pix_id,
          pixQrCode: paggpixResult.qrcode_image,
          pixCopiaECola: paggpixResult.pix_code
        }
      });

      pixId = paggpixResult.pix_id;
      qrCode = paggpixResult.qrcode_image;
      copiaECola = paggpixResult.pix_code;
   } else if (metodoPagamento === 'BOLETO') {
  console.log('💳 Gerando boleto via Mercado Pago...');
  
  const { MercadoPagoConfig, Payment } = require('mercadopago');
  
  const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
  });
  const paymentMP = new Payment(client);

  const paymentData = {
    transaction_amount: plano.preco,
    description: `${plano.nome} - ${plano.produto.nome}`,
    payment_method_id: 'bolbradesco',
    payer: {
      email: compradorEmail || 'contato@finorapayments.com',
      first_name: compradorNome.split(' ')[0],
      last_name: compradorNome.split(' ').slice(1).join(' ') || compradorNome.split(' ')[0],
      identification: {
        type: (compradorCpf?.replace(/\D/g, '').length === 11) ? 'CPF' : 'CNPJ',
        number: compradorCpf?.replace(/\D/g, '') || '00000000000'
      },
      address: {
        zip_code: cep?.replace(/\D/g, '') || '',
        street_name: rua || 'Rua',
        street_number: numero || 'SN',
        neighborhood: bairro || 'Centro',
        city: cidade || 'São Paulo',
        federal_unit: estado || 'SP'
      }
    },
    external_reference: venda.id
  };

  console.log('📤 Dados Mercado Pago:', JSON.stringify(paymentData, null, 2));

  const result = await paymentMP.create({ body: paymentData });

  console.log('📥 Resultado Mercado Pago:', JSON.stringify(result, null, 2));

  if (result.status === 'pending' && result.transaction_details?.external_resource_url) {
    // Atualizar venda com link do boleto
    await prisma.venda.update({
      where: { id: venda.id },
      data: {
        boletoUrl: result.transaction_details.external_resource_url,
        boletoBarcode: result.barcode?.content || null
      }
    });

    console.log('✅ Boleto gerado:', result.transaction_details.external_resource_url);
  } else {
    console.error('❌ Erro ao gerar boleto. Status:', result.status);
    console.error('❌ Detalhes:', JSON.stringify(result, null, 2));
    
    return NextResponse.json({ 
      error: 'Erro ao gerar boleto',
      details: result.status_detail || 'Status: ' + result.status
    }, { status: 500 });
  }
}

    // Buscar produto e vendedor para notificações
    const produto = await prisma.produto.findUnique({
      where: { id: plano.produtoId },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            telegramBotToken: true,
            telegramChatId: true
          }
        }
      }
    });

    // Mensagem VENDA GERADA
    const statusPagamento = venda.metodoPagamento === 'PIX' 
      ? '🟢 PIX Gerado - Aguardando pagamento'
      : venda.metodoPagamento === 'BOLETO'
      ? '🟡 Boleto Gerado - Aguardando pagamento'
      : '💳 Cartão - Processando';

    const mensagemVendaGerada = `🔔 <b>VENDA GERADA</b>\n\n` +
      `💰 Valor: R$ ${venda.valor.toFixed(2)}\n` +
      `👤 Cliente: ${venda.compradorNome}\n` +
      `📧 Email: ${venda.compradorEmail}\n` +
      `📦 Produto: ${plano.nome}\n` +
      `💳 Pagamento: ${venda.metodoPagamento}\n` +
      `${statusPagamento}\n` +
      `🆔 Venda ID: ${venda.id.substring(0,8)}`;

    // 1. Notificação individual do vendedor
    if (produto?.user?.telegramBotToken && produto?.user?.telegramChatId) {
      try {
        await fetch(`${request.nextUrl.origin}/api/telegram/notificar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: produto.user.telegramBotToken,
            chatId: produto.user.telegramChatId,
            mensagem: mensagemVendaGerada
          })
        });
        console.log('✅ Notificação VENDA GERADA enviada para vendedor');
      } catch (e) {
        console.error('Erro notificação vendedor:', e);
      }
    }

    // 2. Notificação geral da plataforma (com nome do vendedor)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        await fetch(`${request.nextUrl.origin}/api/telegram/notificar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: process.env.TELEGRAM_BOT_TOKEN,
            chatId: process.env.TELEGRAM_CHAT_ID,
            mensagem: mensagemVendaGerada + `\n\n🧑‍💼 Vendedor: ${produto?.user?.nome || 'N/A'}`
          })
        });
        console.log('✅ Notificação VENDA GERADA enviada para bot geral');
      } catch (e) {
        console.error('Erro notificação geral:', e);
      }
    }

    return NextResponse.json({
      vendaId: venda.id,
      pixId: pixId,
      qrCode: qrCode,
      copiaECola: copiaECola,
      valor: plano.preco,
      metodoPagamento: venda.metodoPagamento
    });
  } catch (error: any) {
    console.error('Erro ao criar pagamento:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar pagamento',
      details: error.message 
    }, { status: 500 });
  }
}