interface PixelEvent {
  event_name: string;
  event_time: number;
  action_source: string;
  event_source_url: string;
  user_data: {
    em?: string; // email
    ph?: string; // phone
    fn?: string; // first name
    ln?: string; // last name
    ct?: string; // city
    st?: string; // state
    zp?: string; // zip code
    country?: string;
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_ids?: string[];
  };
}

export async function dispararPixelFacebook(
  pixelId: string,
  accessToken: string,
  eventName: string,
  dados: {
    email?: string;
    telefone?: string;
    nome?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    valor?: number;
    produtoNome?: string;
    produtoId?: string;
  }
) {
  try {
    const [firstName, ...lastNameParts] = (dados.nome || '').split(' ');
    const lastName = lastNameParts.join(' ');

    const event: PixelEvent = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: typeof window !== 'undefined' ? window.location.href : 'https://finorapayments.com',
      user_data: {
        em: dados.email ? hashSHA256(dados.email.toLowerCase().trim()) : undefined,
        ph: dados.telefone ? hashSHA256(dados.telefone.replace(/\D/g, '')) : undefined,
        fn: firstName ? hashSHA256(firstName.toLowerCase().trim()) : undefined,
        ln: lastName ? hashSHA256(lastName.toLowerCase().trim()) : undefined,
        ct: dados.cidade ? hashSHA256(dados.cidade.toLowerCase().trim()) : undefined,
        st: dados.estado ? hashSHA256(dados.estado.toLowerCase().trim()) : undefined,
        zp: dados.cep ? hashSHA256(dados.cep.replace(/\D/g, '')) : undefined,
        country: 'br'
      },
      custom_data: dados.valor ? {
        currency: 'BRL',
        value: dados.valor,
        content_name: dados.produtoNome,
        content_ids: dados.produtoId ? [dados.produtoId] : undefined
      } : undefined
    };

    const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [event],
        access_token: accessToken
      })
    });

    const result = await response.json();
    console.log('✅ Pixel Facebook disparado:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro ao disparar pixel Facebook:', error);
    throw error;
  }
}

// Função para hash SHA256 (necessário para CAPI do Facebook)
async function hashSHA256(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback para Node.js (servidor)
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}

export async function dispararPixelsProduto(
  produtoId: string,
  eventoTipo: 'CHECKOUT' | 'COMPRA' | 'PAD',
  condicao: 'PIX' | 'BOLETO' | 'PAD' | 'PAGAMENTO_APROVADO',
  dados: {
    email?: string;
    telefone?: string;
    nome?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    valor?: number;
    produtoNome?: string;
  }
) {
  try {
    // Buscar pixels configurados para este produto
    const response = await fetch(`/api/pixels?produtoId=${produtoId}`);
    if (!response.ok) return;

    const { pixels } = await response.json();
    if (!pixels || pixels.length === 0) return;

    // Filtrar pixels que devem disparar para este evento e condição
    const pixelsParaDisparar = pixels.filter((pixel: any) => {
      // Verifica se o evento está ativo
      const eventoAtivo = 
        (eventoTipo === 'CHECKOUT' && pixel.eventoCheckout) ||
        (eventoTipo === 'COMPRA' && pixel.eventoCompra) ||
        (eventoTipo === 'PAD' && pixel.eventoPAD);

      if (!eventoAtivo) return false;

      // Verifica se a condição está ativa
      const condicaoAtiva =
        (condicao === 'PIX' && pixel.condicaoPix) ||
        (condicao === 'BOLETO' && pixel.condicaoBoleto) ||
        (condicao === 'PAD' && pixel.condicaoPAD) ||
        (condicao === 'PAGAMENTO_APROVADO' && pixel.condicaoPagamentoAprovado);

      return condicaoAtiva;
    });

    // Disparar cada pixel
    for (const pixel of pixelsParaDisparar) {
      if (pixel.plataforma === 'FACEBOOK' && pixel.tokenAPI) {
        const eventName = eventoTipo === 'CHECKOUT' ? 'InitiateCheckout' : 
                         eventoTipo === 'PAD' ? 'Lead' : 'Purchase';

        await dispararPixelFacebook(
          pixel.pixelId,
          pixel.tokenAPI,
          eventName,
          { ...dados, produtoId }
        );
      }
    }

    console.log(`✅ ${pixelsParaDisparar.length} pixels disparados com sucesso`);

  } catch (error) {
    console.error('❌ Erro ao disparar pixels:', error);
  }
}