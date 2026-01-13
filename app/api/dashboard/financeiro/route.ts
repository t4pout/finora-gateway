import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

function verificarToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // Buscar todas as vendas
    const vendas = await prisma.venda.findMany({
      where: user?.role === 'ADMIN' ? {} : { vendedorId: userId },
      include: {
        transacoes: {
          select: {
            valor: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular totais
    const receitaBruta = vendas
      .filter(v => v.status === 'APROVADO')
      .reduce((acc, v) => acc + v.valor, 0);

    const receitaLiquida = vendas
      .filter(v => v.status === 'APROVADO')
      .reduce((acc, v) => {
        const transacao = v.transacoes.find(t => t.status === 'LIBERADO' || t.status === 'PENDENTE');
        return acc + (transacao?.valor || 0);
      }, 0);

    const taxasCobradas = receitaBruta - receitaLiquida;

    // Receita por método de pagamento
    const porMetodo = vendas
      .filter(v => v.status === 'APROVADO')
      .reduce((acc, v) => {
        if (!acc[v.metodoPagamento]) {
          acc[v.metodoPagamento] = { bruto: 0, liquido: 0, count: 0 };
        }
        acc[v.metodoPagamento].bruto += v.valor;
        acc[v.metodoPagamento].count += 1;
        
        const transacao = v.transacoes.find(t => t.status === 'LIBERADO' || t.status === 'PENDENTE');
        acc[v.metodoPagamento].liquido += transacao?.valor || 0;
        
        return acc;
      }, {} as Record<string, { bruto: number; liquido: number; count: number }>);

    // Evolução nos últimos 30 dias
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const evolucao = [];
    for (let i = 0; i < 30; i++) {
      const data = new Date(trintaDiasAtras);
      data.setDate(data.getDate() + i);
      const dataStr = data.toISOString().split('T')[0];

      const vendasDia = vendas.filter(v => {
        const vendaData = new Date(v.createdAt).toISOString().split('T')[0];
        return vendaData === dataStr && v.status === 'APROVADO';
      });

      const brutoDia = vendasDia.reduce((acc, v) => acc + v.valor, 0);
      const liquidoDia = vendasDia.reduce((acc, v) => {
        const transacao = v.transacoes.find(t => t.status === 'LIBERADO' || t.status === 'PENDENTE');
        return acc + (transacao?.valor || 0);
      }, 0);

      evolucao.push({
        data: dataStr,
        dia: data.getDate(),
        mes: data.getMonth() + 1,
        bruto: brutoDia,
        liquido: liquidoDia
      });
    }

    // Saldos na carteira
    const transacoes = await prisma.transacao.findMany({
      where: user?.role === 'ADMIN' ? {} : { userId }
    });

    const agora = new Date();
    const saldoLiberado = transacoes
      .filter(t => t.status === 'LIBERADO' && (!t.dataLiberacao || t.dataLiberacao <= agora))
      .reduce((acc, t) => acc + t.valor, 0);

    const saldoPendente = transacoes
      .filter(t => t.status === 'PENDENTE' || (t.dataLiberacao && t.dataLiberacao > agora))
      .reduce((acc, t) => acc + t.valor, 0);

    const saques = await prisma.saque.findMany({
      where: user?.role === 'ADMIN' 
        ? { status: { in: ['APROVADO', 'PROCESSANDO'] } }
        : { userId, status: { in: ['APROVADO', 'PROCESSANDO'] } }
    });

    const totalSaques = saques.reduce((acc, s) => acc + s.valor, 0);
    const saldoDisponivel = saldoLiberado - totalSaques;

    return NextResponse.json({
      receitaBruta,
      receitaLiquida,
      taxasCobradas,
      porMetodo,
      evolucao,
      carteira: {
        saldoLiberado: saldoDisponivel,
        saldoPendente,
        totalSaques
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
  }
}
