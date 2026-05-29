import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

interface DadosEvento {
  evento: string;
  vendaId?: string;
  produtoNome?: string;
  produtoId?: string;
  valor?: number;
  valorLiquido?: number;
  compradorNome?: string;
  compradorEmail?: string;
  compradorCpf?: string;
  compradorTel?: string;
  metodoPagamento?: string;
  status?: string;
  createdAt?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export async function dispararWebhooks(userId: string, dados: DadosEvento) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { userId, ativo: true, eventos: { has: dados.evento } }
    });

    if (webhooks.length === 0) return;

    for (const webhook of webhooks) {
      const payload = JSON.stringify({
        evento: dados.evento,
        timestamp: new Date().toISOString(),
        data: {
          vendaId: dados.vendaId,
          produtoNome: dados.produtoNome,
          produtoId: dados.produtoId,
          valor: dados.valor,
          valorLiquido: dados.valorLiquido,
          compradorNome: dados.compradorNome,
          compradorEmail: dados.compradorEmail,
          compradorCpf: dados.compradorCpf,
          compradorTel: dados.compradorTel,
          metodoPagamento: dados.metodoPagamento,
          status: dados.status,
          createdAt: dados.createdAt,
          utmSource: dados.utmSource,
          utmMedium: dados.utmMedium,
          utmCampaign: dados.utmCampaign
        }
      });

      const headers: any = { 'Content-Type': 'application/json' };

      if (webhook.secret) {
        const signature = crypto.createHmac('sha256', webhook.secret).update(payload).digest('hex');
        headers['X-Finora-Signature'] = 'sha256=' + signature;
      }

      let statusCode: number | null = null;
      let resposta: string | null = null;
      let sucesso = false;

      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: payload,
          signal: AbortSignal.timeout(10000)
        });
        statusCode = res.status;
        resposta = await res.text().catch(() => null);
        sucesso = res.ok;
        console.log(`✅ Webhook disparado: ${webhook.nome} → ${res.status}`);
      } catch (e: any) {
        resposta = e.message;
        sucesso = false;
        console.error(`❌ Erro ao disparar webhook ${webhook.nome}:`, e.message);
      }

      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          evento: dados.evento,
          statusCode,
          sucesso,
          payload,
          resposta: resposta?.substring(0, 500)
        }
      });
    }
  } catch (e) {
    console.error('❌ Erro ao disparar webhooks:', e);
  }
}

export async function dispararPostbacks(userId: string, dados: DadosEvento) {
  try {
    const postbacks = await prisma.postback.findMany({
      where: { userId, ativo: true, eventos: { has: dados.evento } }
    });

    if (postbacks.length === 0) return;

    const variaveis: Record<string, string> = {
      '{vendaId}': dados.vendaId || '',
      '{produtoNome}': dados.produtoNome || '',
      '{produtoId}': dados.produtoId || '',
      '{valor}': dados.valor?.toFixed(2) || '',
      '{valorLiquido}': dados.valorLiquido?.toFixed(2) || '',
      '{compradorNome}': encodeURIComponent(dados.compradorNome || ''),
      '{compradorEmail}': encodeURIComponent(dados.compradorEmail || ''),
      '{compradorCpf}': dados.compradorCpf?.replace(/\D/g, '') || '',
      '{compradorTel}': dados.compradorTel?.replace(/\D/g, '') || '',
      '{metodoPagamento}': dados.metodoPagamento || '',
      '{status}': dados.status || '',
      '{utmSource}': encodeURIComponent(dados.utmSource || ''),
      '{utmMedium}': encodeURIComponent(dados.utmMedium || ''),
      '{utmCampaign}': encodeURIComponent(dados.utmCampaign || ''),
      '{timestamp}': new Date().toISOString()
    };

    for (const postback of postbacks) {
      let urlFinal = postback.url;
      for (const [variavel, valor] of Object.entries(variaveis)) {
        urlFinal = urlFinal.replaceAll(variavel, valor);
      }

      let statusCode: number | null = null;
      let sucesso = false;

      try {
        const res = await fetch(urlFinal, {
          method: postback.metodo,
          signal: AbortSignal.timeout(10000)
        });
        statusCode = res.status;
        sucesso = res.ok;
        console.log(`✅ Postback disparado: ${postback.nome} → ${res.status}`);
      } catch (e: any) {
        sucesso = false;
        console.error(`❌ Erro ao disparar postback ${postback.nome}:`, e.message);
      }

      await prisma.postbackLog.create({
        data: {
          postbackId: postback.id,
          evento: dados.evento,
          urlDisparada: urlFinal,
          statusCode,
          sucesso
        }
      });
    }
  } catch (e) {
    console.error('❌ Erro ao disparar postbacks:', e);
  }
}