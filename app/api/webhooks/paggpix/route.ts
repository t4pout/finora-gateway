import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const VERIFY_TOKEN = process.env.PAGGPIX_WEBHOOK_TOKEN || 'finora-webhook-secure-token-2026';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Log completo para debug
  console.log('📥 GET recebido no webhook');
  console.log('Query params:', Object.fromEntries(searchParams));
  console.log('Headers:', Object.fromEntries(request.headers));
  
  const mode = searchParams.get('mode');
  const challenge = searchParams.get('challenge');
  const verifyToken = request.headers.get('x-verify-token') || searchParams.get('verify_token');

  console.log('Mode:', mode);
  console.log('Challenge:', challenge);
  console.log('Verify Token:', verifyToken);

  if ((mode === 'subscribe' || mode === 'subscription') && verifyToken === VERIFY_TOKEN) {
    console.log('✅ Verificação bem-sucedida, retornando challenge');
    return new NextResponse(challenge, { status: 200 });
  }

  console.log('❌ Verificação falhou');
  return NextResponse.json({ error: 'Invalid verification' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paggpix-signature');
    const body = await request.text();

    if (!signature) {
      console.error('❌ Assinatura ausente');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verificar assinatura HMAC (SEM prefixo sha256=)
    const hmac = crypto.createHmac('sha256', VERIFY_TOKEN);
    const calculatedSignature = hmac.update(body).digest('hex');
    
    // Remover prefixo sha256= se presente
    const receivedSignature = signature.replace('sha256=', '');

    if (calculatedSignature !== receivedSignature) {
      console.error('❌ Assinatura inválida');
      console.log('Recebida:', receivedSignature);
      console.log('Calculada:', calculatedSignature);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const event = JSON.parse(body);
    console.log('📨 Webhook recebido:', event);

    // Processar evento de pagamento
    if (event.event === 'PAYMENT' && event.data) {
      const { pix_id, status } = event.data;

      if (status === 'DONE') {
        console.log('🔍 Buscando venda/pedido com pixId:', pix_id);

        // Tentar encontrar venda normal primeiro
        let venda = await prisma.venda.findFirst({
          where: { pixId: pix_id },
          include: {
            produto: {
              include: {
                user: true
              }
            }
          }
        });

        if (venda) {
          console.log('✅ Venda normal encontrada:', venda.id);
          return await processarVendaNormal(venda);
        }

        // Se não encontrou venda normal, buscar pedido PAD
        let pedidoPAD = await prisma.pedidoPAD.findFirst({
          where: { pixId: pix_id },
          include: {
            produto: {
              select: {
                nome: true,
                userId: true
              }
            },
            vendedor: {
              include: {
                planoTaxa: true
              }
            }
          }
        });

        if (pedidoPAD) {
          console.log('✅ Pedido PAD encontrado:', pedidoPAD.id);
          return await processarPedidoPAD(pedidoPAD);
        }

        console.error('❌ Nenhuma venda ou pedido PAD encontrado para pixId:', pix_id);
        return NextResponse.json({ error: 'Venda/Pedido não encontrado' }, { status: 404 });
      }
    }

    return NextResponse.json({ status: 'received' }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return NextResponse.json({ 
      error: 'Webhook error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Processar venda normal (checkout)
async function processarVendaNormal(venda: any) {
  if (venda.status === 'PAGO') {
    console.log('⚠️ Venda já estava paga:', venda.id);
    return NextResponse.json({ message: 'Já processado' }, { status: 200 });
  }

  // Atualizar status da venda
  await prisma.venda.update({
    where: { id: venda.id },
    data: { 
      status: 'PAGO',
    }
  });
  // Buscar produto ANTES de tudo
  const produtoCompleto = await prisma.produto.findUnique({
    where: { id: venda.produtoId },
    include: { 
      pixels: true,
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

  const valorVenda = venda.valor;

  // Disparar evento Facebook Pixel Purchase via Conversions API
  try {
    if (produtoCompleto?.pixels && produtoCompleto.pixels.length > 0) {
      const pixelFacebook = produtoCompleto.pixels.find(p => 
        p.plataforma === 'FACEBOOK' && 
        p.status === 'ATIVO' &&
        p.eventoCompra &&
        p.condicaoPagamentoAprovado
      );
      
      if (pixelFacebook && pixelFacebook.tokenAPI) {
        const eventData = {
          data: [{
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: `https://www.finorapayments.com/checkout/${venda.id}`,
            user_data: {
              em: venda.compradorEmail ? crypto.createHash('sha256').update(venda.compradorEmail.toLowerCase().trim()).digest('hex') : undefined,
              fn: venda.compradorNome ? crypto.createHash('sha256').update(venda.compradorNome.toLowerCase().trim()).digest('hex') : undefined,
              ph: venda.compradorTel ? crypto.createHash('sha256').update(venda.compradorTel.replace(/\D/g, '')).digest('hex') : undefined,
            },
            custom_data: {
              value: valorVenda,
              currency: 'BRL',
              content_ids: [venda.produtoId],
              content_type: 'product',
              content_name: produtoCompleto.nome
            }
          }]
        };

        const response = await fetch(
          `https://graph.facebook.com/v18.0/${pixelFacebook.pixelId}/events`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...eventData,
              access_token: pixelFacebook.tokenAPI
            })
          }
        );

        const result = await response.json();
        console.log('📊 Purchase event enviado:', result);
      }
    }
  } catch (e) {
    console.error('Erro ao disparar pixel Purchase:', e);
  }

  // Notificação Telegram: VENDA PAGA
  try {
    const mensagemVendaPaga = `✅ <b>VENDA PAGA</b>\n\n` +
      `💰 Valor: R$ ${valorVenda.toFixed(2)}\n` +
      `👤 Cliente: ${venda.compradorNome}\n` +
      `📧 Email: ${venda.compradorEmail}\n` +
      `📦 Produto: ${produtoCompleto?.nome || 'N/A'}\n` +
      `💳 Pagamento: PIX\n` +
      `✅ Pagamento Confirmado\n` +
      `🆔 Venda ID: ${venda.id.substring(0,8)}`;

    // 1. Notificação individual do vendedor
    if (produtoCompleto?.user?.telegramBotToken && produtoCompleto?.user?.telegramChatId) {
      await fetch('https://www.finorapayments.com/api/telegram/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: produtoCompleto.user.telegramBotToken,
          chatId: produtoCompleto.user.telegramChatId,
          mensagem: mensagemVendaPaga
        })
      });
      console.log('✅ Notificação VENDA PAGA enviada para vendedor');
    }

    // 2. Notificação geral da plataforma
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await fetch('https://www.finorapayments.com/api/telegram/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: process.env.TELEGRAM_BOT_TOKEN,
          chatId: process.env.TELEGRAM_CHAT_ID,
          mensagem: mensagemVendaPaga + `\n\n🧑‍💼 Vendedor: ${produtoCompleto?.user?.nome || 'N/A'}`
        })
      });
      console.log('✅ Notificação VENDA PAGA enviada para bot geral');
    }
  } catch (e) {
    console.error('Erro ao enviar notificação Telegram:', e);
  }

  console.log('✅ Venda marcada como PAGA:', venda.id);
 // Enviar para Google Apps Script (Etiquetas)
  if (venda.produto.tipo === 'FISICO') {
    try {
       await fetch('https://script.google.com/macros/s/AKfycbwkMUNqYZF6ARkYtK7jcVTVSvuWkysWlv4iOnP-fbbyYiSoSrFOSMNjryEqIk_egw4k/exec', {
  method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAGO',
          tipo: venda.produto.tipo,
          compradorNome: venda.compradorNome,
          rua: venda.rua,
          numero: venda.numero,
          complemento: venda.complemento,
          bairro: venda.bairro,
          cidade: venda.cidade,
          estado: venda.estado,
          cep: venda.cep,
          produto: venda.nomePlano || venda.produto.nome
        })
      });
      console.log('📮 Etiqueta enviada para Google Slides');
    } catch (e) {
      console.error('Erro ao gerar etiqueta:', e);
    }
  }

  // Buscar plano de taxa do vendedor
  const vendedor = await prisma.user.findUnique({
    where: { id: venda.produto.userId },
    include: { planoTaxa: true }
  });

  if (!vendedor || !vendedor.planoTaxa) {
    console.error('❌ Vendedor sem plano de taxa');
    return NextResponse.json({ error: 'Plano de taxa não encontrado' }, { status: 400 });
  }

  const valorTotal = venda.valor;
  const taxaPercentual = vendedor.planoTaxa.pixPercentual;
  const taxaFixa = vendedor.planoTaxa.pixFixo;
  const prazoLiberacaoDias = vendedor.planoTaxa.prazoPixDias;

  const valorTaxa = (valorTotal * taxaPercentual / 100) + taxaFixa;
  const valorLiquido = valorTotal - valorTaxa;

  const dataLiberacao = new Date();
  dataLiberacao.setDate(dataLiberacao.getDate() + prazoLiberacaoDias);

  console.log(`💰 Venda: R$ ${valorTotal} | Taxa: ${taxaPercentual}% + R$${taxaFixa} = R$${valorTaxa.toFixed(2)} | Líquido: R$${valorLiquido.toFixed(2)}`);

  // Registrar na carteira como PENDENTE
  await prisma.carteira.create({
    data: {
      usuarioId: venda.produto.userId,
      vendaId: venda.id,
      tipo: 'VENDA',
      valor: valorLiquido,
      descricao: `Venda #${venda.id.substring(0,8)} - ${venda.produto.nome} (Taxa ${taxaPercentual}% + R$${taxaFixa.toFixed(2)})`,
      status: 'PENDENTE'
    }
  });

  // Registrar transação com data de liberação
  await prisma.transacao.create({
    data: {
      userId: venda.produto.userId,
      vendaId: venda.id,
      tipo: 'VENDA',
      valor: valorLiquido,
      status: 'PENDENTE',
      descricao: `Venda #${venda.id.substring(0,8)}`,
      dataLiberacao: dataLiberacao
    }
  });

  console.log(`✅ Saldo PENDENTE adicionado. Liberação: ${dataLiberacao.toLocaleDateString()}`);

  return NextResponse.json({ 
    success: true,
    tipo: 'VENDA_NORMAL',
    vendaId: venda.id,
    valorTotal,
    valorTaxa,
    valorLiquido,
    dataLiberacao
  }, { status: 200 });
}

// Processar pedido PAD
async function processarPedidoPAD(pedido: any) {
  if (pedido.dataPagamento) {
    console.log('⚠️ Pedido PAD já estava pago:', pedido.id);
    return NextResponse.json({ message: 'Já processado' }, { status: 200 });
  }

  // Atualizar status do pedido
  await prisma.pedidoPAD.update({
    where: { id: pedido.id },
    data: { 
      dataPagamento: new Date(),
      status: 'PAGO'
    }
  });
  // Disparar evento Facebook Pixel Purchase
try {
  const produto = await prisma.produto.findUnique({
    where: { id: pedido.produtoId },
    include: { pixels: true }
  });
  
  if (produto?.pixels && produto.pixels.length > 0) {
    const pixelFacebook = produto.pixels.find(p => p.plataforma === 'FACEBOOK' && p.status === 'ATIVO');
    
    if (pixelFacebook) {
      console.log('📊 Purchase event PAD para Pixel:', pixelFacebook.pixelId, {
        transaction_id: pedido.id,
        value: valorTotal,
        currency: 'BRL'
      });
      // TODO: Implementar Facebook Conversions API
    }
  }
} catch (e) {
  console.error('Erro ao disparar pixel PAD:', e);
}
  // Notificação Telegram: PEDIDO PAD PAGO
try {
  const produtoCompleto = await prisma.produto.findUnique({
    where: { id: pedido.produtoId },
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

  const valorTotal = pedido.valor;
  const mensagemPedidoPago = `✅ <b>PEDIDO PAD PAGO</b>\n\n` +
    `💰 Valor: R$ ${valorTotal.toFixed(2)}\n` +
    `👤 Cliente: ${pedido.clienteNome}\n` +
    `📦 Produto: ${produtoCompleto?.nome || 'N/A'}\n` +
    `💳 Pagamento: PIX\n` +
    `✅ Pagamento Confirmado\n` +
    `🔗 Hash: ${pedido.hash}`;

  // 1. Notificação individual do vendedor
  if (produtoCompleto?.user?.telegramBotToken && produtoCompleto?.user?.telegramChatId) {
    await fetch('https://www.finorapayments.com/api/telegram/notificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botToken: produtoCompleto.user.telegramBotToken,
        chatId: produtoCompleto.user.telegramChatId,
        mensagem: mensagemPedidoPago
      })
    });
    console.log('✅ Notificação PEDIDO PAD PAGO enviada para vendedor');
  }

  // 2. Notificação geral da plataforma
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    await fetch('https://www.finorapayments.com/api/telegram/notificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
        mensagem: mensagemPedidoPago + `\n\n🧑‍💼 Vendedor: ${produtoCompleto?.user?.nome || 'N/A'}`
      })
    });
    console.log('✅ Notificação PEDIDO PAD PAGO enviada para bot geral');
  }
} catch (e) {
  console.error('Erro ao enviar notificação Telegram PAD:', e);
}

  console.log('✅ Pedido PAD marcado como PAGO:', pedido.id);

  const planoTaxa = pedido.vendedor.planoTaxa;

  if (!planoTaxa) {
    console.error('❌ Vendedor sem plano de taxa');
    return NextResponse.json({ error: 'Plano de taxa não encontrado' }, { status: 400 });
  }

  const valorTotal = pedido.valor;
  const taxaPercentual = planoTaxa.pixPercentual;
  const taxaFixa = planoTaxa.pixFixo;
  const prazoLiberacaoDias = planoTaxa.prazoPixDias;

  const valorTaxa = (valorTotal * taxaPercentual / 100) + taxaFixa;
  const valorLiquido = valorTotal - valorTaxa;

  const dataLiberacao = new Date();
  dataLiberacao.setDate(dataLiberacao.getDate() + prazoLiberacaoDias);

  console.log(`💰 PAD: R$ ${valorTotal} | Taxa: ${taxaPercentual}% + R$${taxaFixa} = R$${valorTaxa.toFixed(2)} | Líquido: R$${valorLiquido.toFixed(2)}`);

  // Registrar na carteira como PENDENTE
  await prisma.carteira.create({
    data: {
      usuarioId: pedido.produto.userId,
      tipo: 'VENDA_PAD',
      valor: valorLiquido,
      descricao: `Venda PAD #${pedido.hash} - ${pedido.produto.nome} (Taxa ${taxaPercentual}% + R$${taxaFixa.toFixed(2)})`,
      status: 'PENDENTE'
    }
  });

  // Registrar transação com data de liberação
  await prisma.transacao.create({
    data: {
      userId: pedido.produto.userId,
      tipo: 'VENDA_PAD',
      valor: valorLiquido,
      status: 'PENDENTE',
      descricao: `Venda PAD #${pedido.hash}`,
      dataLiberacao: dataLiberacao
    }
  });

  console.log(`✅ Saldo PENDENTE adicionado. Liberação: ${dataLiberacao.toLocaleDateString()}`);

  return NextResponse.json({ 
    success: true,
    tipo: 'PEDIDO_PAD',
    pedidoId: pedido.id,
    valorTotal,
    valorTaxa,
    valorLiquido,
    dataLiberacao
  }, { status: 200 });
}