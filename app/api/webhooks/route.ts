import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Enviar evento para Facebook Pixel
async function enviarFacebookPixel(
  pixelId: string,
  accessToken: string,
  eventoData: any
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: [
            {
              event_name: 'Purchase',
              event_time: Math.floor(Date.now() / 1000),
              user_data: {
                em: eventoData.email ? eventoData.email.toLowerCase() : null,
                ph: eventoData.telefone ? eventoData.telefone.replace(/\D/g, '') : null
              },
              custom_data: {
                currency: 'BRL',
                value: eventoData.valor
              },
              event_source_url: eventoData.url,
              action_source: 'website'
            }
          ],
          access_token: accessToken
        })
      }
    );

    const result = await response.json();
    console.log('Facebook Pixel Response:', result);
    return result;
  } catch (error) {
    console.error('Erro ao enviar para Facebook Pixel:', error);
    return null;
  }
}

// Enviar evento para Google Ads
async function enviarGoogleAds(conversionId: string, eventoData: any) {
  // Google Ads requer configuração mais complexa com gtag
  console.log('Google Ads Conversion:', { conversionId, eventoData });
  // Implementação completa requer Google Ads API
  return { status: 'logged' };
}

// Enviar evento para TikTok Pixel
async function enviarTikTokPixel(
  pixelId: string,
  eventToken: string,
  eventoData: any
) {
  try {
    const response = await fetch(
      'https://business-api.tiktok.com/open_api/v1.3/event/track/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': eventToken
        },
        body: JSON.stringify({
          pixel_code: pixelId,
          event: 'CompletePayment',
          timestamp: new Date().toISOString(),
          context: {
            user_agent: eventoData.userAgent,
            ip: eventoData.ip
          },
          properties: {
            contents: [
              {
                content_id: eventoData.produtoId,
                content_name: eventoData.produtoNome,
                price: eventoData.valor
              }
            ],
            currency: 'BRL',
            value: eventoData.valor
          }
        })
      }
    );

    const result = await response.json();
    console.log('TikTok Pixel Response:', result);
    return result;
  } catch (error) {
    console.error('Erro ao enviar para TikTok Pixel:', error);
    return null;
  }
}

// Processar webhook de conversão
export async function POST(request: NextRequest) {
  try {
    const { vendaId } = await request.json();

    if (!vendaId) {
      return NextResponse.json({ error: 'Venda não informada' }, { status: 400 });
    }

    // Buscar venda com dados da campanha
    const venda = await prisma.venda.findUnique({
      where: { id: vendaId },
      include: {
        produto: true
      }
    });

    if (!venda) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
    }

    // Buscar código de campanha do cookie (se houver)
    const campanhaCode = request.cookies.get('campanha_code')?.value;
    
    if (campanhaCode) {
      // Buscar campanha
      const campanha = await prisma.campanha.findFirst({
        where: {
          linkCampanha: {
            contains: `camp=${campanhaCode}`
          }
        }
      });

      if (campanha) {
        const eventoData = {
          email: venda.compradorEmail,
          telefone: venda.compradorTel,
          valor: venda.valor,
          produtoId: venda.produtoId,
          produtoNome: venda.produto.nome,
          url: request.headers.get('referer') || '',
          userAgent: request.headers.get('user-agent') || '',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
        };

        // Enviar para plataforma correspondente
        if (campanha.plataforma === 'FACEBOOK' && campanha.pixelId && campanha.accessToken) {
          await enviarFacebookPixel(campanha.pixelId, campanha.accessToken, eventoData);
        } else if (campanha.plataforma === 'GOOGLE' && campanha.conversionId) {
          await enviarGoogleAds(campanha.conversionId, eventoData);
        } else if (campanha.plataforma === 'TIKTOK' && campanha.pixelId && campanha.eventToken) {
          await enviarTikTokPixel(campanha.pixelId, campanha.eventToken, eventoData);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processado' });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 });
  }
}
