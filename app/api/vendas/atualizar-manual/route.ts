import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { pixId } = await request.json();
    
    console.log('🔍 Buscando venda com pixId:', pixId);
    
    const venda = await prisma.venda.findFirst({
      where: { 
        OR: [
          { pixId: pixId },
          { pixId: { contains: pixId } }
        ]
      },
      include: {
        produto: {
          include: {
            usuario: true
          }
        }
      }
    });
    
    if (!venda) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
    }
    
    console.log('✅ Venda encontrada:', venda.id);
    
    if (venda.status === 'PAGO') {
      return NextResponse.json({ 
        message: 'Venda já estava paga',
        vendaId: venda.id 
      });
    }
    
    // Atualizar status
    await prisma.venda.update({
      where: { id: venda.id },
      data: { 
        status: 'PAGO',
        dataPagamento: new Date()
      }
    });
    
    console.log('💰 Status atualizado para PAGO');
    
    // Adicionar saldo na carteira
    const valorTotal = venda.valor;
    const taxaPlataforma = 5;
    const valorTaxa = (valorTotal * taxaPlataforma) / 100;
    const valorLiquido = valorTotal - valorTaxa;
    
    await prisma.carteira.create({
      data: {
        usuarioId: venda.produto.usuarioId,
        vendaId: venda.id,
        tipo: 'VENDA',
        valor: valorLiquido,
        descricao: `Venda #${venda.id.substring(0,8)} - ${venda.produto.nome}`,
        status: 'CONFIRMADO'
      }
    });
    
    console.log('✅ Saldo adicionado à carteira');
    
    return NextResponse.json({ 
      success: true, 
      vendaId: venda.id,
      valorTotal,
      valorLiquido,
      message: 'Venda atualizada com sucesso!'
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}