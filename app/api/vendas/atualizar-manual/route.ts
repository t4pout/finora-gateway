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
            user: true
          }
        },
        vendedor: {
          include: {
            planoTaxa: true
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
        status: 'PAGO'
      }
    });
    
    console.log('💰 Status atualizado para PAGO');
    
    const planoTaxa = venda.vendedor.planoTaxa;
    
    if (!planoTaxa) {
      return NextResponse.json({ 
        error: 'Vendedor sem plano de taxa configurado' 
      }, { status: 400 });
    }
    
    const valorTotal = venda.valor;
    const taxaPercentual = planoTaxa.pixPercentual;
    const taxaFixa = planoTaxa.pixFixo;
    const prazoLiberacaoDias = planoTaxa.prazoPixDias;
    
    const valorTaxa = (valorTotal * taxaPercentual / 100) + taxaFixa;
    const valorLiquido = valorTotal - valorTaxa;
    
    const dataLiberacao = new Date();
    dataLiberacao.setDate(dataLiberacao.getDate() + prazoLiberacaoDias);
    
    // Criar carteira como PENDENTE
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
    
    // Criar transação com data de liberação
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
    
    console.log('✅ Saldo PENDENTE adicionado');
    
    return NextResponse.json({ 
      success: true, 
      vendaId: venda.id,
      valorTotal,
      taxaPercentual,
      taxaFixa,
      valorTaxa,
      valorLiquido,
      prazoLiberacaoDias,
      dataLiberacao,
      message: 'Venda atualizada com taxa personalizada!'
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}