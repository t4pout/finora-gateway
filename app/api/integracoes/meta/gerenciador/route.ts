import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura-2026-finora';

function getUserId(req: NextRequest): string | null {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return null;
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch { return null; }
}

const FIELDS_INSIGHTS = 'spend,impressions,clicks,cpc,cpm,ctr,reach,frequency,actions,cost_per_action_type';

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const nivel = searchParams.get('nivel') || 'campanhas';
  const dias = searchParams.get('dias') || '30';
  const campanhaId = searchParams.get('campanhaId') || null;
  const conjuntoId = searchParams.get('conjuntoId') || null;

  const dataFim = new Date().toISOString().split('T')[0];
  const dataInicio = new Date(Date.now() - parseInt(dias) * 86400000).toISOString().split('T')[0];
  const timeRange = `{"since":"${dataInicio}","until":"${dataFim}"}`;

  try {
    const integracao = await prisma.integracaoAnuncio.findFirst({
      where: { userId, plataforma: 'META', ativo: true }
    });

    if (!integracao) return NextResponse.json({ erro: 'Meta Ads nao conectado' }, { status: 404 });

    const token = integracao.accessToken;
    const accountId = integracao.accountId;

    if (!accountId) {
      const meRes = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name&access_token=${token}`);
      const meData = await meRes.json();
      if (meData.data?.length > 0) {
        await prisma.integracaoAnuncio.update({
          where: { id: integracao.id },
          data: { accountId: meData.data[0].id, accountNome: meData.data[0].name }
        });
      }
    }

    const vendas = await prisma.venda.findMany({
      where: { vendedorId: userId, status: 'PAGO', createdAt: { gte: new Date(dataInicio) } },
      select: { valor: true, metodoPagamento: true, utmCampaign: true, utmSource: true }
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { planoTaxa: true } });
    const plano = user?.planoTaxa;

    const calcTaxa = (valor: number, metodo: string) => {
      if (!plano) return (valor * (metodo === 'PIX' ? 3.99 : metodo === 'CARTAO' ? 4.99 : 3.49)) / 100;
      if (metodo === 'PIX') return (valor * plano.pixPercentual / 100) + plano.pixFixo;
      if (metodo === 'CARTAO') return (valor * plano.cartaoPercentual / 100) + plano.cartaoFixo;
      return (valor * plano.boletoPercentual / 100) + plano.boletoFixo;
    };

    const vendasPorCampanha: Record<string, { vendas: number; receita: number }> = {};
    vendas.forEach(v => {
      const chave = v.utmCampaign || '';
      if (!vendasPorCampanha[chave]) vendasPorCampanha[chave] = { vendas: 0, receita: 0 };
      vendasPorCampanha[chave].vendas++;
      vendasPorCampanha[chave].receita += v.valor - calcTaxa(v.valor, v.metodoPagamento);
    });

    const enriquecer = (item: any, nome: string) => {
      const dados = vendasPorCampanha[nome] || { vendas: 0, receita: 0 };
      const gasto = item.gasto || 0;
      const receita = dados.receita;
      return {
        ...item,
        vendasFinora: dados.vendas,
        receitaFinora: Math.round(receita * 100) / 100,
        lucro: Math.round((receita - gasto) * 100) / 100,
        roas: gasto > 0 ? Math.round((receita / gasto) * 100) / 100 : 0,
        cpa: dados.vendas > 0 ? Math.round((gasto / dados.vendas) * 100) / 100 : 0,
        margem: receita > 0 ? Math.round(((receita - gasto) / receita) * 100 * 100) / 100 : 0
      };
    };

    const parseInsights = (insights: any) => {
      const d = insights?.data?.[0];
      if (!d) return { gasto: 0, impressoes: 0, cliques: 0, cpc: 0, cpm: 0, ctr: 0, alcance: 0, frequencia: 0 };
      return {
        gasto: parseFloat(d.spend || '0'),
        impressoes: parseInt(d.impressions || '0'),
        cliques: parseInt(d.clicks || '0'),
        cpc: parseFloat(d.cpc || '0'),
        cpm: parseFloat(d.cpm || '0'),
        ctr: parseFloat(d.ctr || '0'),
        alcance: parseInt(d.reach || '0'),
        frequencia: parseFloat(d.frequency || '0')
      };
    };
     
if (nivel === 'contas') {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/adaccounts?` +
        `fields=id,name,account_status,currency,amount_spent,balance,insights{spend,impressions,clicks,cpc,cpm,ctr}&` +
        `time_range=${timeRange}&` +
        `access_token=${token}`
      );
      const data = await res.json();
      if (data.error) return NextResponse.json({ erro: data.error.message }, { status: 400 });

      const contas = (data.data || []).map((c: any) => {
        const ins = parseInsights(c.insights);
        return enriquecer({
          id: c.id, nome: c.name,
          status: c.account_status === 1 ? 'ACTIVE' : 'PAUSED',
          moeda: c.currency,
          totalGasto: parseFloat(c.amount_spent || '0') / 100,
          saldo: parseFloat(c.balance || '0') / 100,
          ...ins
        }, c.name);
      });

      return NextResponse.json({ contas });
    }
    

    if (nivel === 'campanhas') {
      const url = `https://graph.facebook.com/v19.0/${accountId}/campaigns?` +
        `fields=id,name,status,objective,budget_remaining,daily_budget,lifetime_budget,` +
        `insights{${FIELDS_INSIGHTS}}&` +
        `time_range=${timeRange}&` +
        `access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.error) return NextResponse.json({ erro: data.error.message }, { status: 400 });

      const campanhas = (data.data || []).map((c: any) => {
        const ins = parseInsights(c.insights);
        return enriquecer({
          id: c.id, nome: c.name, status: c.status,
          objetivo: c.objective,
          orcamentoDiario: parseFloat(c.daily_budget || '0') / 100,
          orcamentoTotal: parseFloat(c.lifetime_budget || '0') / 100,
          orcamentoRestante: parseFloat(c.budget_remaining || '0') / 100,
          ...ins
        }, c.name);
      });

      return NextResponse.json({ campanhas, accountNome: integracao.accountNome, accountId });
    }

    if (nivel === 'conjuntos' && campanhaId) {
      const url = `https://graph.facebook.com/v19.0/${campanhaId}/adsets?` +
        `fields=id,name,status,targeting,daily_budget,lifetime_budget,` +
        `insights{${FIELDS_INSIGHTS}}&` +
        `time_range=${timeRange}&` +
        `access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.error) return NextResponse.json({ erro: data.error.message }, { status: 400 });

      const conjuntos = (data.data || []).map((c: any) => {
        const ins = parseInsights(c.insights);
        return enriquecer({
          id: c.id, nome: c.name, status: c.status,
          orcamentoDiario: parseFloat(c.daily_budget || '0') / 100,
          orcamentoTotal: parseFloat(c.lifetime_budget || '0') / 100,
          ...ins
        }, c.name);
      });

      return NextResponse.json({ conjuntos });
    }

    if (nivel === 'anuncios' && conjuntoId) {
      const url = `https://graph.facebook.com/v19.0/${conjuntoId}/ads?` +
        `fields=id,name,status,creative{title,body,thumbnail_url},` +
        `insights{${FIELDS_INSIGHTS}}&` +
        `time_range=${timeRange}&` +
        `access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.error) return NextResponse.json({ erro: data.error.message }, { status: 400 });

      const anuncios = (data.data || []).map((a: any) => {
        const ins = parseInsights(a.insights);
        return enriquecer({
          id: a.id, nome: a.name, status: a.status,
          titulo: a.creative?.title || '',
          corpo: a.creative?.body || '',
          thumbnail: a.creative?.thumbnail_url || '',
          ...ins
        }, a.name);
      });

      return NextResponse.json({ anuncios });
    }

    return NextResponse.json({ erro: 'Nivel invalido' }, { status: 400 });

  } catch (error) {
    console.error('Erro gerenciador Meta:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}