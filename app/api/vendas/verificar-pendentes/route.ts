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

export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('🔍 Verificando vendas pendentes do usuário:', userId);

    // Buscar todas as vendas PENDENTES do usuário com PIX
    const vendasPendentes = await prisma.venda.findMany({
      where: {
        vendedorId: userId,
        status: 'PENDENTE',
        metodoPagamento: 'PIX',
        pixId: { not: null }
      },
      select: {
        id: true,
        pixId: true,
        valor: true,
        compradorNome: true,
        createdAt: true,
        produto: {
          select: {
            nome: true
          }
        }
      }
    });

    console.log(`📊 Encontradas ${vendasPendentes.length} vendas pendentes com PIX`);

    if (vendasPendentes.length === 0) {
      return NextResponse.json({ 
        message: 'Nenhuma venda pendente para verificar',
        total: 0
      });
    }

    const PAGGPIX_API_KEY = process.env.PAGGPIX_API_KEY;
    
    if (!PAGGPIX_API_KEY) {
      return NextResponse.json({ 
        error: 'API Key PaggPix não configurada' 
      }, { status: 500 });
    }

    let atualizadas = 0;
    const detalhes = [];

    for (const venda of vendasPendentes) {
      try {
        console.log(`🔎 Verificando PIX: ${venda.pixId}`);

        // Consultar status na PaggPix
        const response = await fetch(`https://api.paggpix.com/v1/pix/${venda.pixId}`, {
          headers: {
            'Authorization': `Bearer ${PAGGPIX_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const pixData = await response.json();
          
          if (pixData.status === 'DONE' || pixData.status === 'PAID') {
            console.log(`✅ PIX pago encontrado! Atualizando venda ${venda.id}`);
            
            // Atualizar venda para PAGO
            await prisma.venda.update({
              where: { id: venda.id },
              data: {
                status: 'PAGO',
                dataPagamento: new Date()
              }
            });

            // Buscar vendedor com plano de taxa
            const vendedor = await prisma.user.findUnique({
              where: { id: userId },
              include: { planoTaxa: true }
            });

            if (vendedor?.planoTaxa) {
              const valorTotal = venda.valor;
              const taxaPercentual = vendedor.planoTaxa.pixPercentual;
              const taxaFixa = vendedor.planoTaxa.pixFixo;
              const prazoLiberacaoDias = vendedor.planoTaxa.prazoPixDias;

              const valorTaxa = (valorTotal * taxaPercentual / 100) + taxaFixa;
              const valorLiquido = valorTotal - valorTaxa;

              const dataLiberacao = new Date();
              dataLiberacao.setDate(dataLiberacao.getDate() + prazoLiberacaoDias);

              // Criar entrada na carteira
              await prisma.carteira.create({
                data: {
                  usuarioId: userId,
                  vendaId: venda.id,
                  tipo: 'VENDA',
                  valor: valorLiquido,
                  descricao: `Venda #${venda.id.substring(0,8)} - ${venda.produto.nome} (Taxa ${taxaPercentual}% + R$${taxaFixa.toFixed(2)})`,
                  status: 'PENDENTE'
                }
              });

              // Criar transação
              await prisma.transacao.create({
                data: {
                  userId: userId,
                  vendaId: venda.id,
                  tipo: 'VENDA',
                  valor: valorLiquido,
                  status: 'PENDENTE',
                  descricao: `Venda #${venda.id.substring(0,8)}`,
                  dataLiberacao: dataLiberacao
                }
              });
            }

            atualizadas++;
            detalhes.push({
              vendaId: venda.id.substring(0,8),
              cliente: venda.compradorNome,
              valor: venda.valor,
              produto: venda.produto.nome
            });
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar venda ${venda.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      total: vendasPendentes.length,
      atualizadas,
      detalhes
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}