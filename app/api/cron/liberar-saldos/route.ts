import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Este endpoint será chamado automaticamente pela Vercel Cron
// Configurar em vercel.json para rodar todo dia às 00:00

export async function GET(request: NextRequest) {
  try {
    // Verificar autorização (Vercel Cron envia header específico)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'finora-cron-secret-2026';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Também liberar transações com prazo 0 que ficaram como PENDENTE por erro anterior
    const transacoesZeroDias = await prisma.transacao.findMany({
      where: {
        status: 'PENDENTE',
        dataLiberacao: { lte: new Date() }
      }
    });
    for (const t of transacoesZeroDias) {
      if (t.vendaId) {
        await prisma.carteira.updateMany({
          where: { vendaId: t.vendaId, status: 'PENDENTE' },
          data: { status: 'APROVADO' }
        });
      }
      await prisma.transacao.update({
        where: { id: t.id },
        data: { status: 'APROVADO' }
      });
    }

    console.log('🕐 Iniciando liberação automática de saldos...');
    
    const agora = new Date();
    
    // Buscar todas as transações PENDENTES com dataLiberacao vencida
    const transacoesPendentes = await prisma.transacao.findMany({
      where: {
        status: 'PENDENTE',
        dataLiberacao: {
          lte: agora // menor ou igual a agora
        }
      },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Encontradas ${transacoesPendentes.length} transações para liberar`);

    let totalLiberado = 0;
    const liberadas = [];

    for (const transacao of transacoesPendentes) {
      try {
        // Atualizar transação para APROVADO
        await prisma.transacao.update({
          where: { id: transacao.id },
          data: { status: 'APROVADO' }
        });

        // Atualizar carteira correspondente para APROVADO
        // Buscar pela vendaId se existir, senão por usuário + valor + tipo
        if (transacao.vendaId) {
          await prisma.carteira.updateMany({
            where: {
              vendaId: transacao.vendaId,
              status: 'PENDENTE'
            },
            data: { status: 'APROVADO' }
          });
        } else {
          await prisma.carteira.updateMany({
            where: {
              usuarioId: transacao.userId,
              tipo: transacao.tipo,
              valor: transacao.valor,
              status: 'PENDENTE'
            },
            data: { status: 'APROVADO' }
          });
        }

        totalLiberado += transacao.valor;
        liberadas.push({
          transacaoId: transacao.id,
          userId: transacao.userId,
          userName: transacao.user.nome,
          valor: transacao.valor,
          tipo: transacao.tipo
        });

        console.log(`✅ Liberado: R$ ${transacao.valor.toFixed(2)} para ${transacao.user.nome}`);
      } catch (error) {
        console.error(`❌ Erro ao liberar transação ${transacao.id}:`, error);
      }
    }

    console.log(`🎉 Liberação concluída! Total: R$ ${totalLiberado.toFixed(2)}`);

    return NextResponse.json({
      success: true,
      totalTransacoes: transacoesPendentes.length,
      totalLiberado,
      liberadas,
      executadoEm: agora.toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no CRON de liberação:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}