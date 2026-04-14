import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarEmailEbook } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📨 Webhook recebido:', JSON.stringify(body, null, 2));

    // PaggPix envia status dentro de body.data
    const data = body.data || body;
    const status = data.status;
    const externalId = data.external_id;

    if (status !== 'paid') {
      console.log('⏳ Pagamento ainda não confirmado:', status);
      return NextResponse.json({ received: true });
    }

    if (!externalId) {
      console.error('❌ external_id não encontrado');
      return NextResponse.json({ error: 'external_id não encontrado' }, { status: 400 });
    }

    const origin = request.headers.get('host') || 'finorapayments.com';
    const protocol = origin.includes('localhost') ? 'http' : 'https';

    const enviarTelegram = async (botToken: string, chatId: string, mensagem: string) => {
      try {
        await fetch(`${protocol}://${origin}/api/telegram/notificar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botToken, chatId, mensagem })
        });
      } catch (e) { console.error('Erro Telegram:', e); }
    };

    // ==========================================
    // CASO 1: Venda normal
    // ==========================================
    const venda = await prisma.venda.findUnique({
      where: { id: externalId },
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            arquivoUrl: true,
            user: { select: { id: true, nome: true, telegramBotToken: true, telegramChatId: true } }
          }
        }
      }
    });

    if (venda) {
      console.log('✅ Venda normal encontrada:', externalId);

      if (venda.status === 'PAGO') {
        console.log('✅ Venda já paga');
        return NextResponse.json({ received: true, message: 'Já processado' });
      }

      await prisma.venda.update({
        where: { id: externalId },
        data: { status: 'PAGO', metodoPagamento: 'PIX' }
      });

      // Processar carteira
      try {
        await fetch(`${protocol}://${origin}/api/vendas/marcar-pago`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendaId: externalId })
        });
      } catch (e) { console.error('Erro carteira:', e); }

      // CAPI Purchase - Facebook
      try {
        if (venda.produtoId) {
          const pixels = await prisma.pixelConversao.findMany({
            where: { produtoId: venda.produtoId, plataforma: 'FACEBOOK', status: 'ATIVO' }
          });
          console.log('Pixels encontrados:', pixels.length);
          for (const px of pixels) {
            if (px.pixelId && px.tokenAPI) {
              const { dispararEventoCAPI } = await import('@/lib/facebook-capi');
              await dispararEventoCAPI({
                pixelId: px.pixelId,
                accessToken: px.tokenAPI,
                eventName: 'Purchase',
                value: venda.valor,
                contentName: venda.nomePlano || '',
                contentIds: [venda.produtoId],
                email: venda.compradorEmail,
                phone: venda.compradorTel || ''
              });
              console.log('✅ CAPI Purchase disparado para pixel:', px.pixelId);
            }
          }
        }
      } catch (e) { console.error('Erro CAPI Purchase Facebook:', e); }

      // Google Ads Conversão
      try {
        if (venda.produtoId) {
          const pixelsGoogle = await prisma.pixelConversao.findMany({
            where: { produtoId: venda.produtoId, plataforma: 'GOOGLE', status: 'ATIVO', eventoCompra: true }
          });
          for (const px of pixelsGoogle) {
            if (px.pixelId) {
              const { dispararGoogleConversao } = await import('@/lib/google-conversao');
              await dispararGoogleConversao({
                conversionId: px.pixelId,
                valor: venda.valor,
                vendaId: venda.id,
                email: venda.compradorEmail
              });
              console.log('✅ Google Conversão disparada para:', px.pixelId);
            }
          }
        }
      } catch (e) { console.error('Erro Google Conversão:', e); }

      // Telegram
      const mensagem = `✅ <b>VENDA PAGA</b>\n\n` +
        `💰 Valor: R$ ${venda.valor.toFixed(2)}\n` +
        `👤 Cliente: ${venda.compradorNome}\n` +
        `📧 Email: ${venda.compradorEmail}\n` +
        `📦 Produto: ${venda.nomePlano || venda.produto?.nome || ''}\n` +
        `🟢 PIX - Pagamento confirmado\n` +
        `🆔 Venda ID: ${venda.id.substring(0, 8)}`;

      const vendedor = venda.produto?.user;
      if (vendedor?.telegramBotToken && vendedor?.telegramChatId) {
        await enviarTelegram(vendedor.telegramBotToken, vendedor.telegramChatId, mensagem);
      }
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        await enviarTelegram(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, mensagem + `\n\n🧑‍💼 Vendedor: ${vendedor?.nome || 'N/A'}`);
      }

      // Enviar ebook por email se produto digital
      try {
        console.log('🔍 Tipo do produto:', venda.produto?.tipo, '| arquivoUrl:', venda.produto?.arquivoUrl);
        if (venda.produto?.tipo === 'DIGITAL' && venda.produto?.arquivoUrl) {
          console.log('📧 Enviando ebook para:', venda.compradorEmail);
          await enviarEmailEbook({
            compradorNome: venda.compradorNome,
            compradorEmail: venda.compradorEmail,
            produtoNome: venda.produto.nome,
            planoNome: venda.nomePlano || venda.produto.nome,
            valor: venda.valor,
            pedidoId: venda.id,
            arquivoUrl: venda.produto.arquivoUrl
          });
          console.log('✅ Ebook enviado com sucesso!');
        } else {
          console.log('⚠️ Produto não é digital ou não tem arquivo');
        }
      } catch (e) { console.error('❌ Erro ao enviar ebook:', e); }

      console.log('✅ Venda processada com sucesso!');
      return NextResponse.json({ received: true, message: 'Venda processada' });
    }

    // ==========================================
    // CASO 2: PedidoPAD
    // ==========================================
    const pedido = await prisma.pedidoPAD.findUnique({
      where: { id: externalId },
      include: {
        produto: {
          include: {
            user: { select: { id: true, nome: true, telegramBotToken: true, telegramChatId: true } }
          }
        }
      }
    });

    if (pedido) {
      console.log('📦 PedidoPAD encontrado:', externalId);

      if (pedido.vendaId) {
        console.log('✅ PAD já processado');
        return NextResponse.json({ received: true, message: 'Já processado' });
      }

      const novaVenda = await prisma.venda.create({
        data: {
          valor: pedido.valor,
          status: 'PAGO',
          metodoPagamento: 'PIX',
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

      await fetch(`${protocol}://${origin}/api/pad/processar-aprovacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoPadHash: pedido.hash, vendaId: novaVenda.id })
      });

      const mensagemPAD = `✅ <b>PAD PAGO</b>\n\n` +
        `💰 Valor: R$ ${pedido.valor.toFixed(2)}\n` +
        `👤 Cliente: ${pedido.clienteNome}\n` +
        `📦 Produto: ${pedido.produtoNome}\n` +
        `🟢 PIX - Pagamento confirmado\n` +
        `🆔 Pedido: ${pedido.hash}`;

      const vendedor = pedido.produto?.user;
      if (vendedor?.telegramBotToken && vendedor?.telegramChatId) {
        await enviarTelegram(vendedor.telegramBotToken, vendedor.telegramChatId, mensagemPAD);
      }
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        await enviarTelegram(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, mensagemPAD + `\n\n🧑‍💼 Vendedor: ${vendedor?.nome || 'N/A'}`);
      }

      console.log('✅ PedidoPAD processado com sucesso!');
      return NextResponse.json({ received: true, message: 'PAD processado' });
    }

    console.error('❌ Referência não encontrada:', externalId);
    return NextResponse.json({ error: 'Referência não encontrada' }, { status: 404 });

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error);
    return NextResponse.json({ error: 'Erro ao processar webhook', details: error.message }, { status: 500 });
  }
}