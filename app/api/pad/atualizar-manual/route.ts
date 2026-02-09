import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { hash } = await request.json();
    
    console.log('🔍 Buscando pedido PAD:', hash);
    
    const pedido = await prisma.pedidoPAD.findUnique({
      where: { hash },
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
    
    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }
    
    console.log('✅ Pedido encontrado:', pedido.id);
    
    // Atualizar status do pedido para mostrar que foi pago
    await prisma.pedidoPAD.update({
      where: { id: pedido.id },
      data: { 
        dataPagamento: new Date()
      }
    });
    
    console.log('💰 Data de pagamento atualizada');
    
    // Buscar taxa personalizada do vendedor
    const planoTaxa = pedido.vendedor.planoTaxa;
    
    if (!planoTaxa) {
      return NextResponse.json({ 
        error: 'Vendedor sem plano de taxa configurado' 
      }, { status: 400 });
    }
    
    const valorTotal = pedido.valor;
    const taxaPercentual = planoTaxa.pixPercentual;
    const taxaFixa = planoTaxa.pixFixo;
    const prazoLiberacaoDias = planoTaxa.prazoPixDias;
    
    // Calcular taxa
    const valorTaxa = (valorTotal * taxaPercentual / 100) + taxaFixa;
    const valorLiquido = valorTotal - valorTaxa;
    
    // Calcular data de liberação
    const dataLiberacao = new Date();
    dataLiberacao.setDate(dataLiberacao.getDate() + prazoLiberacaoDias);
    
    console.log(`📊 Taxa: ${taxaPercentual}% + R$${taxaFixa} = R$${valorTaxa.toFixed(2)}`);
    console.log(`📅 Prazo: ${prazoLiberacaoDias} dias - Liberação em ${dataLiberacao.toLocaleDateString()}`);
    
    // Verificar se já existe entrada na carteira
    const carteiraExistente = await prisma.carteira.findFirst({
      where: {
        usuarioId: pedido.produto.userId,
        descricao: { contains: pedido.hash }
      }
    });
    
    if (carteiraExistente) {
      // Atualizar com valores corretos
      await prisma.carteira.update({
        where: { id: carteiraExistente.id },
        data: {
          valor: valorLiquido,
          status: 'PENDENTE',
          descricao: `Venda PAD #${pedido.hash} - ${pedido.produto.nome} (Taxa ${taxaPercentual}% + R$${taxaFixa.toFixed(2)} descontada)`
        }
      });
      
      // Criar transação com data de liberação
      await prisma.transacao.create({
        data: {
          usuarioId: pedido.produto.userId,
          tipo: 'VENDA_PAD',
          valor: valorLiquido,
          status: 'PENDENTE',
          descricao: `Venda PAD #${pedido.hash}`,
          dataLiberacao: dataLiberacao
        }
      });
      
      return NextResponse.json({ 
        message: 'Carteira atualizada com valores corretos',
        pedidoId: pedido.id,
        carteiraId: carteiraExistente.id,
        valorTotal,
        valorTaxa,
        valorLiquido,
        prazoLiberacaoDias,
        dataLiberacao
      });
    }
    
    // Criar entrada na carteira como PENDENTE
    const carteira = await prisma.carteira.create({
      data: {
        usuarioId: pedido.produto.userId,
        tipo: 'VENDA_PAD',
        valor: valorLiquido,
        descricao: `Venda PAD #${pedido.hash} - ${pedido.produto.nome} (Taxa ${taxaPercentual}% + R$${taxaFixa.toFixed(2)} descontada)`,
        status: 'PENDENTE'
      }
    });
    
    // Criar transação com data de liberação
    await prisma.transacao.create({
      data: {
        usuarioId: pedido.produto.userId,
        tipo: 'VENDA_PAD',
        valor: valorLiquido,
        status: 'PENDENTE',
        descricao: `Venda PAD #${pedido.hash}`,
        dataLiberacao: dataLiberacao
      }
    });
    
    console.log('✅ Saldo adicionado à carteira (PENDENTE)');
    
    return NextResponse.json({ 
      success: true,
      message: 'Pedido PAD atualizado com taxa personalizada!',
      pedidoId: pedido.id,
      carteiraId: carteira.id,
      valorTotal,
      taxaPercentual,
      taxaFixa,
      valorTaxa,
      valorLiquido,
      prazoLiberacaoDias,
      dataLiberacao,
      planoTaxa: planoTaxa.nome
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}