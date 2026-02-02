import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔔 Webhook Mercado Pago recebido:', JSON.stringify(body, null, 2));

    // Mercado Pago envia notificações assim:
    // { id: "123456", live_mode: true, type: "payment", data: { id: "123456" } }
    
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
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
      }
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

    // Verificar se foi aprovado
    if (payment.status !== 'approved') {
      console.log('⏳ Pagamento ainda não aprovado:', payment.status);
      return NextResponse.json({ received: true });
    }

    const pedidoId = payment.external_reference; // ID do pedido PAD

    if (!pedidoId) {
      console.error('❌ External reference não encontrado');
      return NextResponse.json({ error: 'Pedido não identificado' }, { status: 400 });
    }

    // Buscar pedido PAD pelo ID
    const pedido = await prisma.pedidoPAD.findUnique({
      where: { id: pedidoId }
    });

    if (!pedido) {
      console.error('❌ Pedido PAD não encontrado:', pedidoId);
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Verificar se já foi processado
    if (pedido.vendaId) {
      console.log('✅ Pagamento já foi processado anteriormente');
      return NextResponse.json({ received: true, message: 'Já processado' });
    }

    // Criar registro de venda
    const venda = await prisma.venda.create({
      data: {
        valor: pedido.valor,
        status: 'PAGO',
        metodoPagamento: payment.payment_method_id === 'bolbradesco' ? 'BOLETO' : 'CARTAO',
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
    const origin = request.headers.get('host') || 'finorapayments.com';
    const protocol = origin.includes('localhost') ? 'http' : 'https';
    
    await fetch(`${protocol}://${origin}/api/pad/processar-aprovacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pedidoPadHash: pedido.hash,
        vendaId: venda.id
      })
    });

    console.log('✅ Webhook Mercado Pago processado com sucesso!');

    return NextResponse.json({ 
      received: true, 
      message: 'Pagamento processado com sucesso' 
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook MP:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook', details: error.message },
      { status: 500 }
    );
  }
}