import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('🔔 Webhook Mercado Pago recebido:', JSON.stringify(body, null, 2));

    if (body.type !== 'payment') {
      console.log('⏭️ Ignorando evento não-pagamento');
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.error('❌ Payment ID não encontrado');
      return NextResponse.json({ error: 'Payment ID não encontrado' }, { status: 400 });
    }

    // Buscar detalhes do pagamento no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
    });

    if (!mpResponse.ok) {
      console.error('❌ Erro ao buscar pagamento no MP');
      return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: 500 });
    }

    const payment = await mpResponse.json();

    console.log('💰 Pagamento MP:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      payment_method_id: payment.payment_method_id
    });

    if (payment.status !== 'approved') {
      console.log('⏳ Pagamento ainda não aprovado:', payment.status);
      return NextResponse.json({ received: true });
    }

    const referenceId = payment.external_reference;
    if (!referenceId) {
      console.error('❌ External reference não encontrado');
      return NextResponse.json({ error: 'Pedido não identificado' }, { status: 400 });
    }

    const origin = request.headers.get('host') || 'finorapayments.com';
    const protocol = origin.includes('localhost') ? 'http' : 'https';

    // ==========================================
    // CASO 1: Verificar se é uma Venda normal
    // ==========================================
    const vendaExistente = await prisma.venda.findUnique({
      where: { id: referenceId }
    });

    if (vendaExistente) {
      console.log('💳 Referência é uma Venda normal:', referenceId);

      if (vendaExistente.status === 'PAGO') {
        console.log('✅ Venda já foi paga anteriormente');
        return NextResponse.json({ received: true, message: 'Já processado' });
      }

      // Detectar método de pagamento
      let metodoPagamento = vendaExistente.metodoPagamento;
      if (payment.payment_method_id === 'pix') metodoPagamento = 'PIX';
      else if (payment.payment_method_id === 'bolbradesco') metodoPagamento = 'BOLETO';
      else if (payment.payment_method_id !== 'bolbradesco' && payment.payment_method_id !== 'pix') metodoPagamento = 'CARTAO';

      await prisma.venda.update({
        where: { id: referenceId },
        data: {
          status: 'PAGO',
          metodoPagamento
        }
      });

      console.log('✅ Venda normal marcada como PAGO:', referenceId);

      // Processar carteira do vendedor
      try {
        await fetch(`${protocol}://${origin}/api/vendas/marcar-pago`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendaId: referenceId })
        });
      } catch (e) {
        console.error('Erro ao processar carteira:', e);
      }

      return NextResponse.json({ received: true, message: 'Venda processada com sucesso' });
    }

    // ==========================================
    // CASO 2: Verificar se é um PedidoPAD
    // ==========================================
    const pedido = await prisma.pedidoPAD.findUnique({
      where: { id: referenceId }
    });

    if (pedido) {
      console.log('📦 Referência é um PedidoPAD:', referenceId);

      if (pedido.vendaId) {
        console.log('✅ Pagamento já foi processado anteriormente');
        return NextResponse.json({ received: true, message: 'Já processado' });
      }

      let metodoPagamento = 'CARTAO';
      if (payment.payment_method_id === 'pix') metodoPagamento = 'PIX';
      else if (payment.payment_method_id === 'bolbradesco') metodoPagamento = 'BOLETO';

      const venda = await prisma.venda.create({
        data: {
          valor: pedido.valor,
          status: 'PAGO',
          metodoPagamento,
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
        body: JSON.stringify({ pedidoPadHash: pedido.hash, vendaId: venda.id })
      });

      console.log('✅ PedidoPAD processado com sucesso!');
      return NextResponse.json({ received: true, message: 'Pagamento PAD processado com sucesso' });
    }

    console.error('❌ Referência não encontrada em Venda nem PedidoPAD:', referenceId);
    return NextResponse.json({ error: 'Referência não encontrada' }, { status: 404 });

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook MP:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook', details: error.message },
      { status: 500 }
    );
  }
}