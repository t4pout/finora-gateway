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
        produto: { 
          include: { 
            user: { include: { planoTaxa: true } },
            coProdutores: {
              where: { ativo: true },
              include: { usuario: true }
            }
          } 
        }
      }
    });
    
    if (!venda) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
    
    const planoTaxa = venda.produto.user.planoTaxa;
    if (!planoTaxa) return NextResponse.json({ error: 'Sem plano de taxa' }, { status: 400 });
    
    const valorTotal = venda.valor;

    // Selecionar taxa e prazo corretos baseado no método de pagamento
    let percentualTaxa = planoTaxa.pixPercentual;
    let taxaFixa = planoTaxa.pixFixo;
    let prazoDias = planoTaxa.prazoPixDias;

    const metodo = venda.metodoPagamento?.toUpperCase() || 'PIX';

    if (metodo === 'CARTAO' || metodo === 'CREDIT_CARD' || metodo === 'CARTÃO') {
      percentualTaxa = planoTaxa.cartaoPercentual;
      taxaFixa = planoTaxa.cartaoFixo;
      prazoDias = planoTaxa.prazoCartaoDias;
    } else if (metodo === 'BOLETO') {
      percentualTaxa = planoTaxa.boletoPercentual;
      taxaFixa = planoTaxa.boletoFixo;
      prazoDias = planoTaxa.prazoBoletoDias;
    }

    const valorTaxa = (valorTotal * percentualTaxa / 100) + taxaFixa;
    const valorLiquido = valorTotal - valorTaxa;

    const dataLiberacao = new Date();
    dataLiberacao.setDate(dataLiberacao.getDate() + prazoDias);

    // Calcular splits de co-produção
    let totalCoProdutores = 0;
    const splitsCoProducao: { usuarioId: string; valor: number; nome: string }[] = [];

    for (const cp of venda.produto.coProdutores) {
      let valorCp = 0;
      if (cp.tipo === 'PERCENTUAL') {
        valorCp = parseFloat(((valorLiquido * cp.valor) / 100).toFixed(2));
      } else {
        valorCp = cp.valor;
      }
      totalCoProdutores += valorCp;
      splitsCoProducao.push({ 
        usuarioId: cp.usuarioId, 
        valor: valorCp,
        nome: cp.usuario.nome
      });
    }

    // Valor final do produtor principal (descontando co-produtores)
    const valorProdutor = parseFloat((valorLiquido - totalCoProdutores).toFixed(2));
    
    // Criar carteira do produtor principal
    await prisma.carteira.create({
      data: {
        usuarioId: venda.produto.userId,
        vendaId: venda.id,
        tipo: 'VENDA',
        valor: valorProdutor,
        descricao: `Venda #${venda.id.substring(0,8)} - ${venda.produto.nome}`,
        status: 'PENDENTE'
      }
    });
    
    // Criar transação do produtor principal
    await prisma.transacao.create({
      data: {
        userId: venda.produto.userId,
        vendaId: venda.id,
        tipo: 'VENDA',
        valor: valorProdutor,
        status: 'PENDENTE',
        descricao: `Venda #${venda.id.substring(0,8)}`,
        dataLiberacao
      }
    });

    // Criar carteira e transação para cada co-produtor
    for (const split of splitsCoProducao) {
      await prisma.carteira.create({
        data: {
          usuarioId: split.usuarioId,
          vendaId: venda.id,
          tipo: 'COPRODUCAO',
          valor: split.valor,
          descricao: `Co-produção Venda #${venda.id.substring(0,8)} - ${venda.produto.nome}`,
          status: 'PENDENTE'
        }
      });

      await prisma.transacao.create({
        data: {
          userId: split.usuarioId,
          vendaId: venda.id,
          tipo: 'COPRODUCAO',
          valor: split.valor,
          status: 'PENDENTE',
          descricao: `Co-produção Venda #${venda.id.substring(0,8)}`,
          dataLiberacao
        }
      });
    }
    
    return NextResponse.json({ success: true, valorLiquido: valorProdutor, coProdutores: splitsCoProducao });
    
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}