import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { vendaId } = await request.json();
    
    // Atualizar venda
    await prisma.venda.update({
      where: { id: vendaId },
      data: { status: 'PAGO' }
    });
    
    // Buscar venda atualizada
    const venda = await prisma.venda.findUnique({
      where: { id: vendaId },
      include: {
        produto: { include: { user: { include: { planoTaxa: true } } } }
      }
    });
    
    if (!venda) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
    
    const planoTaxa = venda.produto.user.planoTaxa;
    if (!planoTaxa) return NextResponse.json({ error: 'Sem plano de taxa' }, { status: 400 });
    
    const valorTotal = venda.valor;
    const valorTaxa = (valorTotal * planoTaxa.pixPercentual / 100) + planoTaxa.pixFixo;
    const valorLiquido = valorTotal - valorTaxa;
    
    const dataLiberacao = new Date();
    dataLiberacao.setDate(dataLiberacao.getDate() + planoTaxa.prazoPixDias);
    
    // Criar carteira
    await prisma.carteira.create({
      data: {
        usuarioId: venda.produto.userId,
        vendaId: venda.id,
        tipo: 'VENDA',
        valor: valorLiquido,
        descricao: `Venda #${venda.id.substring(0,8)} - ${venda.produto.nome}`,
        status: 'PENDENTE'
      }
    });
    
    // Criar transação
    await prisma.transacao.create({
      data: {
        userId: venda.produto.userId,
        vendaId: venda.id,
        tipo: 'VENDA',
        valor: valorLiquido,
        status: 'PENDENTE',
        descricao: `Venda #${venda.id.substring(0,8)}`,
        dataLiberacao
      }
    });
    
    return NextResponse.json({ success: true, valorLiquido });
    
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}