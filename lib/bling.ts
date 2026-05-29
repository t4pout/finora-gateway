import { prisma } from '@/lib/prisma';

async function refreshBlingToken(integracao: any) {
  try {
    const credentials = Buffer.from(
      process.env.BLING_CLIENT_ID + ':' + process.env.BLING_CLIENT_SECRET
    ).toString('base64');

    const res = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + credentials
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: integracao.refreshToken
      })
    });

    const data = await res.json();
    if (!res.ok || !data.access_token) {
      console.error('❌ Erro ao renovar token Bling:', data);
      return null;
    }

    const expiresAt = new Date(Date.now() + (data.expires_in || 21600) * 1000);

    await prisma.integracaoBling.update({
      where: { userId: integracao.userId },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiresAt: expiresAt
      }
    });

    return data.access_token;
  } catch (e) {
    console.error('❌ Erro ao renovar token Bling:', e);
    return null;
  }
}

export async function emitirNFeBling({
  userId,
  compradorNome,
  compradorEmail,
  compradorCpf,
  compradorTel,
  cep,
  rua,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
  produtoNome,
  valor,
  vendaId
}: {
  userId: string;
  compradorNome: string;
  compradorEmail: string;
  compradorCpf?: string;
  compradorTel?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  produtoNome: string;
  valor: number;
  vendaId: string;
}) {
  try {
    const integracao = await prisma.integracaoBling.findUnique({ where: { userId } });

    if (!integracao || !integracao.ativo || !integracao.emiteNFAutomatico) {
      console.log('ℹ️ Bling não configurado ou desativado para userId:', userId);
      return null;
    }

    if (!integracao.accessToken) {
      console.log('ℹ️ Sem token Bling para userId:', userId);
      return null;
    }

    // Verificar se token expirou
    let accessToken = integracao.accessToken;
    if (integracao.tokenExpiresAt && new Date() > integracao.tokenExpiresAt) {
      console.log('🔄 Token Bling expirado, renovando...');
      accessToken = await refreshBlingToken(integracao) || accessToken;
    }

    // Montar body da NF-e
    const nfeBody: any = {
      tipo: 1,
      naturezaOperacao: integracao.naturezaOperacao || 'Venda de mercadoria',
      serie: parseInt(integracao.serieNF || '1'),
      contato: {
        nome: compradorNome,
        email: compradorEmail || '',
        tipoPessoa: 'F',
        numeroDocumento: compradorCpf?.replace(/\D/g, '') || '',
        telefone: compradorTel?.replace(/\D/g, '') || '',
        endereco: {
          endereco: rua || '',
          numero: numero || 'S/N',
          complemento: complemento || '',
          bairro: bairro || '',
          cep: cep?.replace(/\D/g, '') || '',
          municipio: cidade || '',
          uf: estado || 'SP',
          pais: 'Brasil'
        }
      },
      itens: [
        {
          descricao: produtoNome,
          valor: valor,
          quantidade: 1,
          unidade: 'UN',
          tipo: 'P',
          origem: 0,
          cst: '102',
          cfop: '5102'
        }
      ],
      observacoes: `Venda Finora #${vendaId.substring(0, 8)}`
    };

    console.log('📄 Emitindo NF-e Bling para venda:', vendaId);

    const res = await fetch('https://www.bling.com.br/Api/v3/nfe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      },
      body: JSON.stringify(nfeBody)
    });

    const data = await res.json();
    console.log('📄 Resposta NF-e Bling:', JSON.stringify(data));

    if (!res.ok) {
      console.error('❌ Erro ao emitir NF-e:', data);
      return null;
    }

    console.log('✅ NF-e emitida com sucesso! ID:', data.data?.id);
    return data.data;

  } catch (e) {
    console.error('❌ Erro ao emitir NF-e Bling:', e);
    return null;
  }
}