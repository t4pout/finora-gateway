import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pedidoPadHash, vendaId } = body;

    console.log('🔔 Processando aprovação de pagamento PAD:', { pedidoPadHash, vendaId });

    if (!pedidoPadHash || !vendaId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Buscar pedido PAD
    const pedidoPad = await prisma.pedidoPAD.findUnique({
      where: { hash: pedidoPadHash }
    });

    if (!pedidoPad) {
      return NextResponse.json(
        { error: 'Pedido PAD não encontrado' },
        { status: 404 }
      );
    }

    // Buscar venda
    const venda = await prisma.venda.findUnique({
      where: { id: vendaId },
      include: {
        vendedor: {
          include: {
            planoTaxa: true
          }
        }
      }
    });

    if (!venda) {
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      );
    }

    // Calcular taxa da plataforma
    const planoTaxa = venda.vendedor.planoTaxa;
    let taxaPercentual = 0;
    let taxaFixa = 0;

    if (planoTaxa) {
      switch (venda.metodoPagamento) {
        case 'PIX':
          taxaPercentual = planoTaxa.pixPercentual;
          taxaFixa = planoTaxa.pixFixo;
          break;
        case 'CARTAO':
          taxaPercentual = planoTaxa.cartaoPercentual;
          taxaFixa = planoTaxa.cartaoFixo;
          break;
        case 'BOLETO':
          taxaPercentual = planoTaxa.boletoPercentual;
          taxaFixa = planoTaxa.boletoFixo;
          break;
      }
    } else {
      // Taxa padrão se não tiver plano
      taxaPercentual = 4.99; // 4.99%
      taxaFixa = 0.39; // R$ 0,39
    }

    // Calcular valores
    const valorBruto = venda.valor;
    const valorTaxaPercentual = valorBruto * (taxaPercentual / 100);
    const valorTaxaTotal = valorTaxaPercentual + taxaFixa;
    const valorLiquido = valorBruto - valorTaxaTotal;

    console.log('💰 Cálculo:', {
      valorBruto,
      taxaPercentual,
      taxaFixa,
      valorTaxaTotal,
      valorLiquido
    });

    // Atualizar status do pedido PAD para PAGO
    await prisma.pedidoPAD.update({
      where: { hash: pedidoPadHash },
      data: {
        status: 'PAGO',
        vendaId: vendaId
      }
    });

    // Atualizar status da venda
    await prisma.venda.update({
      where: { id: vendaId },
      data: { status: 'PAGO' }
    });

    // Adicionar saldo na carteira do vendedor
    await prisma.carteira.create({
      data: {
        usuarioId: venda.vendedorId,
        vendaId: vendaId,
        tipo: 'CREDITO',
        valor: valorLiquido,
        descricao: `Venda PAD aprovada - Pedido ${pedidoPadHash} (Bruto: R$ ${valorBruto.toFixed(2)} - Taxa: R$ ${valorTaxaTotal.toFixed(2)})`,
        status: 'PENDENTE'
      }
    });

    // Enviar notificação de pagamento confirmado
    try {
      const vendedorCompleto = await prisma.user.findUnique({
        where: { id: venda.vendedorId },
        select: {
          telegramBotToken: true,
          telegramChatId: true
        }
      });

      if (vendedorCompleto?.telegramBotToken && vendedorCompleto?.telegramChatId) {
        const mensagemPagamento = `💰 <b>PAGAMENTO CONFIRMADO!</b>\n\n` +
          `📦 Pedido: ${pedidoPadHash}\n` +
          `💵 Valor: R$ ${valorBruto.toFixed(2)}\n` +
          `💳 Método: ${venda.metodoPagamento}\n` +
          `💸 Taxa: R$ ${valorTaxaTotal.toFixed(2)}\n` +
          `✅ Líquido: R$ ${valorLiquido.toFixed(2)}\n\n` +
          `🎉 O valor já está disponível na sua carteira!`;

        await fetch(`${request.nextUrl.origin}/api/telegram/notificar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: vendedorCompleto.telegramBotToken,
            chatId: vendedorCompleto.telegramChatId,
            mensagem: mensagemPagamento
          })
        });

        console.log('✅ Notificação de pagamento enviada');
      }
    } catch (error) {
      console.error('Erro ao enviar notificação de pagamento:', error);
    }

    // Processar comissão de afiliado se houver
    if (pedidoPad.afiliacaoId) {
      try {
        const afiliacao = await prisma.afiliacao.findUnique({
          where: { id: pedidoPad.afiliacaoId },
          include: { afiliado: true }
        });

        if (afiliacao && afiliacao.status === 'ATIVO') {
          const valorComissao = valorBruto * (afiliacao.comissao / 100);

          // Criar registro de comissão
          await prisma.comissao.create({
            data: {
              valor: valorComissao,
              percentual: afiliacao.comissao,
              status: 'PENDENTE',
              vendaId: vendaId,
              afiliadoId: afiliacao.afiliadoId
            }
          });

          // Adicionar saldo na carteira do afiliado
          await prisma.carteira.create({
            data: {
              usuarioId: afiliacao.afiliadoId,
              vendaId: vendaId,
              tipo: 'CREDITO',
              valor: valorComissao,
              descricao: `Comissão PAD - ${afiliacao.comissao}% de R$ ${valorBruto.toFixed(2)} - Pedido ${pedidoPadHash}`,
              status: 'PENDENTE'
            }
          });

          // Incrementar conversões
          await prisma.afiliacao.update({
            where: { id: pedidoPad.afiliacaoId },
            data: {
              conversoes: {
                increment: 1
              }
            }
          });

          console.log('💰 Comissão de afiliado criada:', {
            afiliado: afiliacao.afiliado.nome,
            valorComissao,
            percentual: afiliacao.comissao
          });
        }
      } catch (error) {
        console.error('Erro ao processar comissão de afiliado:', error);
      }
    }

    console.log('✅ Pagamento processado com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Pagamento processado com sucesso',
      valores: {
        valorBruto,
        valorTaxaTotal,
        valorLiquido
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar aprovação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento', details: error.message },
      { status: 500 }
    );
  }
}