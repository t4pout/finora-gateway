import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

function getUserId(req: NextRequest): string | null {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return null;
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch { return null; }
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dias = parseInt(searchParams.get('dias') || '7');
  const dataInicio = new Date(Date.now() - dias * 86400000);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { planoTaxa: true } });
    if (!user) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    const plano = user.planoTaxa;

    const calcularTaxa = (valor: number, metodo: string): number => {
      if (!plano) {
        if (metodo === 'PIX') return (valor * 3.99) / 100;
        if (metodo === 'CARTAO') return (valor * 4.99) / 100;
        if (metodo === 'BOLETO') return (valor * 3.49) / 100;
        return 0;
      }
      if (metodo === 'PIX') return (valor * plano.pixPercentual / 100) + plano.pixFixo;
      if (metodo === 'CARTAO') return (valor * plano.cartaoPercentual / 100) + plano.cartaoFixo;
      if (metodo === 'BOLETO') return (valor * plano.boletoPercentual / 100) + plano.boletoFixo;
      return 0;
    };

    const vendas = await prisma.venda.findMany({
      where: { vendedorId: userId, status: 'PAGO', createdAt: { gte: dataInicio } },
      select: { valor: true, metodoPagamento: true, createdAt: true }
    });

    const despesas = await prisma.despesa.findMany({
      where: { userId, data: { gte: dataInicio } },
      select: { valor: true, data: true }
    });

    const integracao = await prisma.integracaoAnuncio.findFirst({
      where: { userId, plataforma: 'META', ativo: true }
    });

    let metaInsightsPorDia: Record<string, { spend: number; impressions: number; clicks: number; cpc: number; cpm: number; ctr: number }> = {};

    if (integracao?.accessToken && integracao?.accountId) {
      try {
        const dataFim = new Date().toISOString().split('T')[0];
        const dataInicioStr = dataInicio.toISOString().split('T')[0];
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${integracao.accountId}/insights?` +
          `fields=spend,impressions,clicks,cpc,cpm,ctr,date_start&` +
          `time_range={"since":"${dataInicioStr}","until":"${dataFim}"}&` +
          `time_increment=1&` +
          `access_token=${integracao.accessToken}`
        );
        const data = await res.json();
        if (!data.error && data.data) {
          data.data.forEach((d: any) => {
            metaInsightsPorDia[d.date_start] = {
              spend: parseFloat(d.spend || '0'),
              impressions: parseInt(d.impressions || '0'),
              clicks: parseInt(d.clicks || '0'),
              cpc: parseFloat(d.cpc || '0'),
              cpm: parseFloat(d.cpm || '0'),
              ctr: parseFloat(d.ctr || '0')
            };
          });
        }
      } catch (e) { console.error('Erro Meta insights:', e); }
    }

    const linhasPorDia: Record<string, any> = {};

    for (let i = 0; i < dias; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const chave = d.toISOString().split('T')[0];
      linhasPorDia[chave] = {
        data: d.toLocaleDateString('pt-BR'),
        diaSemana: DIAS_SEMANA[d.getDay()],
        vendas: 0, faturamentoBruto: 0, faturamentoLiquido: 0,
        taxas: 0, despesas: 0, gastosMeta: 0,
        lucro: 0, roas: 0, margem: 0, roi: 0, cpa: 0,
        impressoes: 0, cliques: 0, ctr: 0, cpc: 0, cpm: 0
      };
    }

    vendas.forEach(v => {
      const chave = v.createdAt.toISOString().split('T')[0];
      if (!linhasPorDia[chave]) return;
      const taxa = calcularTaxa(v.valor, v.metodoPagamento);
      linhasPorDia[chave].vendas++;
      linhasPorDia[chave].faturamentoBruto += v.valor;
      linhasPorDia[chave].taxas += taxa;
      linhasPorDia[chave].faturamentoLiquido += v.valor - taxa;
    });

    despesas.forEach(d => {
      const chave = new Date(d.data).toISOString().split('T')[0];
      if (!linhasPorDia[chave]) return;
      linhasPorDia[chave].despesas += d.valor;
    });

    Object.keys(linhasPorDia).forEach(chave => {
      const meta = metaInsightsPorDia[chave] || {};
      const linha = linhasPorDia[chave];
      linha.gastosMeta = meta.spend || 0;
      linha.impressoes = meta.impressions || 0;
      linha.cliques = meta.clicks || 0;
      linha.cpc = meta.cpc || 0;
      linha.cpm = meta.cpm || 0;
      linha.ctr = meta.ctr || 0;
      const totalCustos = linha.gastosMeta + linha.despesas;
      linha.lucro = linha.faturamentoLiquido - totalCustos;
      linha.roas = linha.gastosMeta > 0 ? linha.faturamentoLiquido / linha.gastosMeta : 0;
      linha.margem = linha.faturamentoLiquido > 0 ? (linha.lucro / linha.faturamentoLiquido) * 100 : 0;
      linha.roi = totalCustos > 0 ? linha.faturamentoLiquido / totalCustos : 0;
      linha.cpa = linha.vendas > 0 ? linha.gastosMeta / linha.vendas : 0;
      Object.keys(linha).forEach(k => {
        if (typeof linha[k] === 'number') linha[k] = Math.round(linha[k] * 100) / 100;
      });
    });

    const linhas = Object.values(linhasPorDia).sort((a: any, b: any) =>
      new Date(b.data.split('/').reverse().join('-')).getTime() - new Date(a.data.split('/').reverse().join('-')).getTime()
    );

    const totais = linhas.reduce((acc: any, l: any) => {
      acc.vendas = (acc.vendas || 0) + l.vendas;
      acc.faturamentoBruto = (acc.faturamentoBruto || 0) + l.faturamentoBruto;
      acc.faturamentoLiquido = (acc.faturamentoLiquido || 0) + l.faturamentoLiquido;
      acc.taxas = (acc.taxas || 0) + l.taxas;
      acc.despesas = (acc.despesas || 0) + l.despesas;
      acc.gastosMeta = (acc.gastosMeta || 0) + l.gastosMeta;
      acc.lucro = (acc.lucro || 0) + l.lucro;
      acc.impressoes = (acc.impressoes || 0) + l.impressoes;
      acc.cliques = (acc.cliques || 0) + l.cliques;
      return acc;
    }, {});

    const totalCustos = totais.gastosMeta + totais.despesas;
    totais.roas = totais.gastosMeta > 0 ? totais.faturamentoLiquido / totais.gastosMeta : 0;
    totais.roi = totalCustos > 0 ? totais.faturamentoLiquido / totalCustos : 0;
    totais.cpa = totais.vendas > 0 ? totais.gastosMeta / totais.vendas : 0;

    Object.keys(totais).forEach(k => {
      if (typeof totais[k] === 'number') totais[k] = Math.round(totais[k] * 100) / 100;
    });

    return NextResponse.json({ linhas, totais });

  } catch (error) {
    console.error('Erro relatorio:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}