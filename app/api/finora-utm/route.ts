import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

function getUserId(req: NextRequest): string | null {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return null;
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dias = parseInt(searchParams.get('dias') || '30');
  const dataInicio = new Date(Date.now() - dias * 86400000);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { planoTaxa: true }
    });

    if (!user) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    const plano = user.planoTaxa;

    const vendas = await prisma.venda.findMany({
      where: { vendedorId: userId, status: 'PAGO', createdAt: { gte: dataInicio } },
      select: {
        id: true, valor: true, metodoPagamento: true,
        utmSource: true, utmMedium: true, utmCampaign: true,
        createdAt: true, compradorNome: true,
        produto: { select: { nome: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const vendasPendentes = await prisma.venda.findMany({
      where: { vendedorId: userId, status: 'PENDENTE', createdAt: { gte: dataInicio } },
      select: { id: true, valor: true, metodoPagamento: true, utmCampaign: true }
    });

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

    let faturamentoBruto = 0;
    let totalTaxas = 0;
    let vendasPix = 0, vendasCartao = 0, vendasBoleto = 0;
    let receitaPix = 0, receitaCartao = 0, receitaBoleto = 0;

    vendas.forEach(v => {
      const taxa = calcularTaxa(v.valor, v.metodoPagamento);
      faturamentoBruto += v.valor;
      totalTaxas += taxa;
      if (v.metodoPagamento === 'PIX') { vendasPix++; receitaPix += v.valor; }
      if (v.metodoPagamento === 'CARTAO') { vendasCartao++; receitaCartao += v.valor; }
      if (v.metodoPagamento === 'BOLETO') { vendasBoleto++; receitaBoleto += v.valor; }
    });

    const faturamentoLiquido = faturamentoBruto - totalTaxas;
    const totalVendasPendentes = vendasPendentes.reduce((acc, v) => acc + v.valor, 0);

    const porCampanha = new Map<string, {
      campanha: string; vendas: number; faturamentoBruto: number;
      faturamentoLiquido: number; taxas: number;
    }>();

    vendas.forEach(v => {
      const chave = v.utmCampaign || '(sem campanha)';
      const taxa = calcularTaxa(v.valor, v.metodoPagamento);
      const atual = porCampanha.get(chave) || { campanha: chave, vendas: 0, faturamentoBruto: 0, faturamentoLiquido: 0, taxas: 0 };
      atual.vendas++;
      atual.faturamentoBruto += v.valor;
      atual.taxas += taxa;
      atual.faturamentoLiquido += v.valor - taxa;
      porCampanha.set(chave, atual);
    });

    const porSource = new Map<string, { source: string; vendas: number; faturamentoLiquido: number; taxas: number }>();
    vendas.forEach(v => {
      const chave = v.utmSource || '(direto)';
      const taxa = calcularTaxa(v.valor, v.metodoPagamento);
      const atual = porSource.get(chave) || { source: chave, vendas: 0, faturamentoLiquido: 0, taxas: 0 };
      atual.vendas++;
      atual.faturamentoLiquido += v.valor - taxa;
      atual.taxas += taxa;
      porSource.set(chave, atual);
    });

    const integracao = await prisma.integracaoAnuncio.findFirst({
      where: { userId, plataforma: 'META', ativo: true }
    });

    let campanhasMeta: any[] = [];
    let gastosMeta = 0;

    if (integracao?.accessToken && integracao?.accountId) {
      try {
        const dataFim = new Date().toISOString().split('T')[0];
        const dataInicioStr = dataInicio.toISOString().split('T')[0];
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${integracao.accountId}/campaigns?` +
          `fields=id,name,status,insights{spend,impressions,clicks,cpc,cpm,ctr}&` +
          `time_range={"since":"${dataInicioStr}","until":"${dataFim}"}&` +
          `access_token=${integracao.accessToken}`
        );
        const data = await res.json();
        if (!data.error && data.data) {
          campanhasMeta = data.data.map((c: any) => {
            const insights = c.insights?.data?.[0];
            const gasto = parseFloat(insights?.spend || '0');
            gastosMeta += gasto;
            const dadosVenda = porCampanha.get(c.name) || { vendas: 0, faturamentoLiquido: 0, faturamentoBruto: 0, taxas: 0 };
            const lucro = dadosVenda.faturamentoLiquido - gasto;
            const roas = gasto > 0 ? dadosVenda.faturamentoLiquido / gasto : 0;
            const margem = dadosVenda.faturamentoLiquido > 0 ? (lucro / dadosVenda.faturamentoLiquido) * 100 : 0;
            const cpa = dadosVenda.vendas > 0 ? gasto / dadosVenda.vendas : 0;
            return {
              id: c.id, nome: c.name, status: c.status,
              gasto, impressoes: parseInt(insights?.impressions || '0'),
              cliques: parseInt(insights?.clicks || '0'),
              cpc: parseFloat(insights?.cpc || '0'),
              cpm: parseFloat(insights?.cpm || '0'),
              ctr: parseFloat(insights?.ctr || '0'),
              vendas: dadosVenda.vendas,
              faturamentoBruto: dadosVenda.faturamentoBruto,
              faturamentoLiquido: dadosVenda.faturamentoLiquido,
              taxas: dadosVenda.taxas, lucro, roas, margem, cpa
            };
          });
        }
      } catch (e) { console.error('Erro Meta API:', e); }
    }

    const lucroTotal = faturamentoLiquido - gastosMeta;
    const roasGeral = gastosMeta > 0 ? faturamentoLiquido / gastosMeta : 0;
    const margemGeral = faturamentoLiquido > 0 ? (lucroTotal / faturamentoLiquido) * 100 : 0;
    const cpaGeral = vendas.length > 0 ? gastosMeta / vendas.length : 0;

    return NextResponse.json({
      resumo: {
        faturamentoBruto: Math.round(faturamentoBruto * 100) / 100,
        faturamentoLiquido: Math.round(faturamentoLiquido * 100) / 100,
        totalTaxas: Math.round(totalTaxas * 100) / 100,
        gastosMeta: Math.round(gastosMeta * 100) / 100,
        lucro: Math.round(lucroTotal * 100) / 100,
        roas: Math.round(roasGeral * 100) / 100,
        margem: Math.round(margemGeral * 100) / 100,
        cpa: Math.round(cpaGeral * 100) / 100,
        totalVendas: vendas.length,
        vendasPendentes: vendasPendentes.length,
        totalVendasPendentes: Math.round(totalVendasPendentes * 100) / 100,
        vendasPix, vendasCartao, vendasBoleto,
        receitaPix: Math.round(receitaPix * 100) / 100,
        receitaCartao: Math.round(receitaCartao * 100) / 100,
        receitaBoleto: Math.round(receitaBoleto * 100) / 100,
        planoTaxa: plano ? { nome: plano.nome, pixPercentual: plano.pixPercentual, cartaoPercentual: plano.cartaoPercentual } : null
      },
      campanhasMeta,
      porCampanha: Array.from(porCampanha.values()).sort((a, b) => b.faturamentoLiquido - a.faturamentoLiquido),
      porSource: Array.from(porSource.values()).sort((a, b) => b.faturamentoLiquido - a.faturamentoLiquido),
      vendas: vendas.slice(0, 50)
    });

  } catch (error) {
    console.error('Erro Finora UTM:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}