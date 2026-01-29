import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔔 Webhook PaggPix recebido:', body);

    // Verificar se o pagamento foi aprovado
    if (body.status !== 'paid') {
      console.log('⏳ Pagamento ainda não confirmado:', body.status);
      return NextResponse.json({ received: true });
    }

    const externalId = body.external_id; // ID do pedido PAD

    if (!externalId) {
      console.error('❌ external_id não encontrado no webhook');
      return NextResponse.json({ error: 'external_id não encontrado' }, { status: 400 });
    }

    // Buscar pedido PAD pelo ID
    const pedido = await prisma.pedidoPAD.findUnique({
      where: { id: externalId }
    });

    if (!pedido) {
      console.error('❌ Pedido PAD não encontrado:', externalId);
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Verificar se já foi processado
    if (pedido.vendaId) {
      console.log('✅ Pedido já foi processado anteriormente');
      return NextResponse.json({ received: true, message: 'Já processado' });
    }

    // Criar registro de venda
    const venda = await prisma.venda.create({
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

    console.log('✅ Webhook processado com sucesso!');

    return NextResponse.json({ 
      received: true, 
      message: 'Pagamento processado com sucesso' 
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook', details: error.message },
      { status: 500 }
    );
  }
}