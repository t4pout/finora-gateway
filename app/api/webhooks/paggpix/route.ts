import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const VERIFY_TOKEN = process.env.PAGGPIX_WEBHOOK_TOKEN || 'finora-webhook-secure-token-2026';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const challenge = searchParams.get('challenge');
  const verifyToken = request.headers.get('x-verify-token');

  if (mode === 'subscribe' && verifyToken === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid verification' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paggpix-signature');
    const body = await request.text();

    // Verificar assinatura HMAC
    const hmac = crypto.createHmac('sha256', VERIFY_TOKEN);
    const expectedSignature = `sha256=${hmac.update(body).digest('hex')}`;

    if (signature !== expectedSignature) {
      console.error('❌ Assinatura inválida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const event = JSON.parse(body);
    console.log('📨 Webhook recebido:', event);

    // Processar evento de pagamento
    if (event.event === 'PAYMENT' && event.data) {
      const { pix_id, status, amount } = event.data;

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

    return NextResponse.json({ received: true }, { status: 200 });

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
      dataPagamento: new Date()
    }
  });

  console.log('✅ Venda marcada como PAGA:', venda.id);

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