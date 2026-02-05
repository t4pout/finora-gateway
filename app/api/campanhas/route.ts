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

function gerarCodigoCampanha() {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const produtoId = searchParams.get('produtoId');

    const where: any = { userId };
    if (produtoId) {
      where.produtoId = produtoId;
    }

    const campanhas = await prisma.campanha.findMany({
      where,
      include: {
        produto: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, campanhas });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar campanhas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { nome, produtoId, plataforma, pixelId, accessToken, eventToken, conversionId, paginaOfertaId } = await request.json();

    if (!nome || !produtoId || !plataforma || !paginaOfertaId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Gerar cà³digo àºnico para campanha
    const codigoCampanha = gerarCodigoCampanha();
    
    // Buscar página de oferta
    let paginaOferta = await prisma.paginaOferta.findUnique({
      where: { id: paginaOfertaId }
    });

    // Se está em teste A/B, escolher versão aleatoriamente
    if (paginaOferta?.testeAB && paginaOferta.versaoOriginal) {
      const random = Math.random() * 100;
      
      if (random > paginaOferta.distribuicao) {
        // Usar versão alternativa
        const versaoAlternativa = await prisma.paginaOferta.findUnique({
          where: { id: paginaOferta.versaoOriginal }
        });
        
        if (versaoAlternativa) {
          paginaOferta = versaoAlternativa;
        }
      }
      
      // Incrementar visualizações
      await prisma.paginaOferta.update({
        where: { id: paginaOferta.id },
        data: {
          visualizacoes: {
            increment: 1
          }
        }
      });
    }

    if (!paginaOferta) {
      return NextResponse.json({ error: 'Página de oferta não encontrada' }, { status: 404 });
    }
    
    // Gerar link da campanha
    // Adicionar código de campanha ao link da página
    const separator = paginaOferta.link.includes('?') ? '&' : '?';
    const linkCampanha = `${paginaOferta.link}${separator}camp=${codigoCampanha}`;

    const campanha = await prisma.campanha.create({
      data: {
        nome,
        produtoId,
        plataforma,
        pixelId: pixelId || null,
        accessToken: accessToken || null,
        eventToken: eventToken || null,
        conversionId: conversionId || null,
        linkCampanha,
        paginaOfertaId,
        userId,
        status: 'ATIVO'
      }
    });

    return NextResponse.json({ success: true, campanha });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao criar campanha' }, { status: 500 });
  }
}
