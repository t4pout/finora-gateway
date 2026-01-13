import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Autenticação básica (você pode melhorar isso)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'seu-token-secreto-aqui';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const agora = new Date();
    
    // Buscar transações pendentes que já passaram da data de liberação
    const transacoesPendentes = await prisma.transacao.findMany({
      where: {
        status: 'PENDENTE',
        dataLiberacao: {
          lte: agora
        }
      }
    });

    // Liberar todas as transações elegíveis
    const resultado = await prisma.transacao.updateMany({
      where: {
        status: 'PENDENTE',
        dataLiberacao: {
          lte: agora
        }
      },
      data: {
        status: 'LIBERADO'
      }
    });

    console.log(`✅ ${resultado.count} transações liberadas automaticamente`);

    return NextResponse.json({
      success: true,
      liberadas: resultado.count,
      transacoes: transacoesPendentes.map(t => ({
        id: t.id,
        userId: t.userId,
        valor: t.valor,
        dataLiberacao: t.dataLiberacao
      }))
    });

  } catch (error) {
    console.error('❌ Erro no job de liberação:', error);
    return NextResponse.json({ error: 'Erro ao liberar saldos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
