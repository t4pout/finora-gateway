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
        }
      }
    });
    
    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }
    
    console.log('✅ Pedido encontrado:', pedido.id);
    
    // Atualizar status para indicar que foi pago
    await prisma.pedidoPAD.update({
      where: { id: pedido.id },
      data: { 
        dataPagamento: new Date(),
        status: 'AGUARDANDO_ENVIO' // Já estava nesse status, mas garantindo
      }
    });
    
    console.log('💰 Status atualizado');
    
    // Adicionar saldo na carteira do vendedor
    const valorTotal = pedido.valor;
    const taxaPlataforma = 5; // 5%
    const valorTaxa = (valorTotal * taxaPlataforma) / 100;
    const valorLiquido = valorTotal - valorTaxa;
    
    // Verificar se já existe entrada na carteira
    const carteiraExistente = await prisma.carteira.findFirst({
      where: {
        usuarioId: pedido.produto.userId,
        descricao: { contains: pedido.hash }
      }
    });
    
    if (carteiraExistente) {
      return NextResponse.json({ 
        message: 'Pedido já tinha saldo creditado',
        pedidoId: pedido.id,
        carteiraId: carteiraExistente.id
      });
    }
    
    // Criar entrada na carteira
    const carteira = await prisma.carteira.create({
      data: {
        usuarioId: pedido.produto.userId,
        tipo: 'VENDA_PAD',
        valor: valorLiquido,
        descricao: `Venda PAD #${pedido.hash} - ${pedido.produto.nome} (Taxa ${taxaPlataforma}% descontada)`,
        status: 'CONFIRMADO'
      }
    });
    
    console.log('✅ Saldo adicionado à carteira do vendedor');
    
    return NextResponse.json({ 
      success: true,
      message: 'Pedido PAD atualizado e saldo creditado!',
      pedidoId: pedido.id,
      carteiraId: carteira.id,
      valorTotal,
      valorTaxa,
      valorLiquido,
      vendedorId: pedido.produto.userId
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}