import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { enviarEmailEbook } from '@/lib/email';
import { emitirNFeBling } from '@/lib/bling';
import { dispararWebhooks, dispararPostbacks } from '@/lib/ferramentas';
import { enviarNotificacaoPush } from '@/lib/expo-push';
import { enviarPushParaUsuario } from '@/lib/web-push';

// Processa uma venda como PAGA de forma completa e idempotente.
// Deve ser o ÚNICO lugar que marca uma venda normal como PAGO,
// seja chamado pelo webhook oficial do gateway ou pela verificação manual.
export async function processarVendaPaga(vendaId: string) {
  // Atualização atômica: só marca como PAGO se ainda NÃO estiver paga.
  // Isso evita que duas chamadas concorrentes (webhook oficial + verificação manual)
  // processem a mesma venda duas vezes (double-processing / Purchase duplicado).
  const atualizacao = await prisma.venda.updateMany({
    where: { id: vendaId, status: { not: 'PAGO' } },
    data: { status: 'PAGO' }
  });

  if (atualizacao.count === 0) {
    // Ou a venda não existe, ou outra chamada concorrente já processou ela agora mesmo.
    const vendaExistente = await prisma.venda.findUnique({ where: { id: vendaId } });
    if (!vendaExistente) {
      console.error('❌ Venda não encontrada:', vendaId);
      return { error: 'Venda não encontrada', status: 404 as const };
    }
    console.log('⚠️ Venda já estava paga (bloqueado por concorrência):', vendaId);
    return { jaProcessado: true, vendaId };
  }

  const venda = await prisma.venda.findUnique({
    where: { id: vendaId },
    include: {
      produto: {
        include: { user: true }
      }
    }
  });

  if (!venda) {
    console.error('❌ Venda não encontrada após atualização:', vendaId);
    return { error: 'Venda não encontrada', status: 404 as const };
  }

  // Buscar produto completo (com pixels)
  const produtoCompleto = await prisma.produto.findUnique({
    where: { id: venda.produtoId },
    select: {
      id: true,
      nome: true,
      tipo: true,
      arquivoUrl: true,
      userId: true,
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
            event_id: venda.id,
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...eventData, access_token: pixelFacebook.tokenAPI })
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

  // Enviar para Google Apps Script (Etiquetas) se produto físico
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
    return { error: 'Plano de taxa não encontrado', status: 400 as const };
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
  const metodoTexto = venda.metodoPagamento === 'CARTAO' ? 'cartão' : venda.metodoPagamento === 'BOLETO' ? 'boleto' : 'pix';

  // Gera código de rastreio próprio, se o frete escolhido tiver um Tipo de Envio configurado
  try {
    if (venda.freteNome) {
      const opcaoFrete = await prisma.opcaoFrete.findFirst({
        where: { produtoId: venda.produto.id, nome: venda.freteNome },
        include: { tipoEnvio: true }
      });
      if (opcaoFrete?.tipoEnvioId) {
        const codigo = 'FN' + Math.random().toString(36).substring(2, 6).toUpperCase() + Date.now().toString().slice(-5);
        await prisma.venda.update({
          where: { id: venda.id },
          data: { codigoRastreio: codigo, dataInicioRastreio: new Date() }
        });
        console.log('📦 Código de rastreio gerado:', codigo);
      }
    }
  } catch (e) { console.error('Erro ao gerar código de rastreio:', e); }

  try {
    await enviarNotificacaoPush(
      vendedor.expoPushToken,
      'Nova venda aprovada!',
      'Nova venda de ' + metodoTexto + ' aprovada! Sua comissão: R$ ' + valorLiquido.toFixed(2) + '!',
      { tipo: 'VENDA_PAGA', vendaId: venda.id }
    );
  } catch (e) {
    console.error('❌ ERRO NO EXPO PUSH (nao bloqueou o resto):', e);
  }

  try {
    await enviarPushParaUsuario(venda.produto.userId, {
      titulo: 'Nova venda aprovada!',
      corpo: 'Nova venda de ' + metodoTexto + ' aprovada! Sua comissão: R$ ' + valorLiquido.toFixed(2) + '!',
      url: '/dashboard/vendas'
    });
  } catch (e) {
    console.error('❌ ERRO NO WEB PUSH (nao bloqueou o resto):', e);
  }

  try {
    if (produtoCompleto?.tipo === 'DIGITAL' && produtoCompleto?.arquivoUrl) {
      console.log('📧 Enviando ebook para:', venda.compradorEmail);
      await enviarEmailEbook({
        compradorNome: venda.compradorNome,
        compradorEmail: venda.compradorEmail,
        produtoNome: produtoCompleto.nome,
        planoNome: venda.nomePlano || produtoCompleto.nome,
        valor: venda.valor,
        pedidoId: venda.id,
        arquivoUrl: produtoCompleto.arquivoUrl
      });
      console.log('✅ Ebook enviado com sucesso!');
    }
  } catch (e) { console.error('❌ Erro ao enviar ebook:', e); }

 try {
    await emitirNFeBling({
      userId: venda.produto.userId,
      compradorNome: venda.compradorNome,
      compradorEmail: venda.compradorEmail,
      compradorCpf: venda.compradorCpf ?? undefined,
      compradorTel: venda.compradorTel ?? undefined,
      cep: venda.cep ?? undefined,
      rua: venda.rua ?? undefined,
      numero: venda.numero ?? undefined,
      complemento: venda.complemento ?? undefined,
      bairro: venda.bairro ?? undefined,
      cidade: venda.cidade ?? undefined,
      estado: venda.estado ?? undefined,
      produtoNome: produtoCompleto?.nome || venda.produto.nome,
      valor: venda.valor,
      vendaId: venda.id
    });
  } catch (e) { console.error('❌ Erro ao emitir NF-e Bling:', e); }

  try {
    const dadosEvento = {
      evento: 'VENDA_PAGA',
      vendaId: venda.id,
      produtoNome: produtoCompleto?.nome || venda.produto.nome,
      produtoId: venda.produtoId,
      nomePlano: venda.nomePlano || null,
      valor: venda.valor,
      valorProduto: venda.orderBumpsValor ? venda.valor - venda.orderBumpsValor : venda.valor,
      valorOrderBumps: venda.orderBumpsValor || 0,
      orderBumps: (venda.orderBumpsNomes || []).map((nome: string) => ({ nome, valor: 0 })),
      valorLiquido,
      compradorNome: venda.compradorNome,
      compradorEmail: venda.compradorEmail,
      compradorCpf: venda.compradorCpf,
      compradorTel: venda.compradorTel,
      metodoPagamento: 'PIX',
      status: 'PAGO',
      createdAt: new Date().toISOString(),
      utmSource: venda.utmSource,
      utmMedium: venda.utmMedium,
      utmCampaign: venda.utmCampaign,
      afiliadoId: (venda as any).afiliadoId || null,
      afiliadoEmail: null,
      comissaoAfiliado: null,
      linkPagamento: `https://www.finorapayments.com/pedido/${venda.id}`,
      pixCopiaECola: venda.pixCopiaECola || null,
      boletoUrl: venda.boletoUrl || null
    };
    await dispararWebhooks(venda.produto.userId, dadosEvento as any);

    try {
      const aidaUrl = process.env.AIDA_WEBHOOK_URL;
      const aidaSecret = process.env.AIDA_WEBHOOK_SECRET;
      if (aidaUrl) {
        const payload = JSON.stringify({
          evento: 'VENDA_PAGA',
          timestamp: new Date().toISOString(),
          data: {
            vendaId: venda.id,
            produtoNome: produtoCompleto?.nome || venda.produto.nome,
            produtoId: venda.produtoId,
            valor: venda.valor,
            valorLiquido,
            compradorNome: venda.compradorNome,
            compradorEmail: venda.compradorEmail,
            compradorCpf: venda.compradorCpf,
            compradorTel: venda.compradorTel,
            metodoPagamento: 'PIX',
            status: 'PAGO',
            createdAt: new Date().toISOString(),
            utmSource: venda.utmSource,
            utmMedium: venda.utmMedium,
            utmCampaign: venda.utmCampaign
          }
        });
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (aidaSecret) {
          const sig = crypto.createHmac('sha256', aidaSecret).update(payload).digest('hex');
          headers['X-Finora-Signature'] = 'sha256=' + sig;
        }
        await fetch(aidaUrl, { method: 'POST', headers, body: payload });
        console.log('✅ AidaTraffic webhook disparado');
      }
    } catch (e) {
      console.error('❌ Erro ao disparar AidaTraffic webhook:', e);
    }

    await dispararPostbacks(venda.produto.userId, dadosEvento as any);
  } catch (e) { console.error('❌ Erro ao disparar webhooks/postbacks:', e); }

  return {
    success: true as const,
    tipo: 'VENDA_NORMAL' as const,
    vendaId: venda.id,
    valorTotal,
    valorTaxa,
    valorLiquido,
    dataLiberacao
  };
}




