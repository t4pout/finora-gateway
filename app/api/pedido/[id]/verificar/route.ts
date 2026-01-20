import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PAGGPIX_TOKEN = process.env.PAGGPIX_TOKEN;
const PAGGPIX_API = 'https://public-api.paggpix.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🔍 Verificando pedido:', id);
    
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        produto: {
          include: {
            usuario: true
          }
        },
        plano: true
      }
    });

    if (!venda) {
      console.log('❌ Pedido não encontrado');
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    console.log('📊 Status atual da venda:', venda.status);

    // Se já está pago, retorna direto
    if (venda.status === 'PAGO' || venda.status === 'APROVADO') {
      console.log('✅ Venda já estava PAGA');
      return NextResponse.json({ status: venda.status });
    }

    // Verificar no PaggPix
    if (venda.pixId) {
      console.log('🔄 Consultando PaggPix, pixId:', venda.pixId);
      
      try {
        const verifyRes = await fetch(`${PAGGPIX_API}/payments/${venda.pixId}/verify`, {
          headers: {
            'Authorization': `Bearer ${PAGGPIX_TOKEN}`
          }
        });

        console.log('📡 Status resposta PaggPix:', verifyRes.status);

        if (verifyRes.ok) {
          const paggpixData = await verifyRes.json();
          console.log('📦 Dados PaggPix:', JSON.stringify(paggpixData));
          
          // Se foi pago no PaggPix, processar tudo
          if (paggpixData.paid || paggpixData.status === 'PAID' || paggpixData.status === 'paid') {
            console.log('💰 PAGAMENTO CONFIRMADO! Processando...');
            
            // 1. Atualizar status da venda
            await prisma.venda.update({
              where: { id },
              data: { 
                status: 'PAGO',
                dataPagamento: new Date()
              }
            });
            console.log('✅ Status atualizado para PAGO');

            // 2. Calcular valores
            const valorTotal = venda.valor;
            const taxaPlataforma = venda.plano?.taxaPlataforma || 5;
            const valorTaxa = (valorTotal * taxaPlataforma) / 100;
            const valorLiquido = valorTotal - valorTaxa;

            console.log(`💵 Valores: Total=${valorTotal}, Taxa=${valorTaxa}, Líquido=${valorLiquido}`);

            // 3. Registrar taxa da plataforma
            await prisma.carteira.create({
              data: {
                usuarioId: venda.produto.userId,
                vendaId: venda.id,
                tipo: 'TAXA_PLATAFORMA',
                valor: -valorTaxa,
                descricao: `Taxa de ${taxaPlataforma}% sobre venda #${venda.id.substring(0,8)}`,
                status: 'CONFIRMADO'
              }
            });
            console.log(`💳 Taxa registrada: -R$ ${valorTaxa.toFixed(2)}`);

            // 4. Registrar valor líquido na carteira
            await prisma.carteira.create({
              data: {
                usuarioId: venda.produto.userId,
                vendaId: venda.id,
                tipo: 'VENDA',
                valor: valorLiquido,
                descricao: `Venda #${venda.id.substring(0,8)} - ${venda.produto.nome}`,
                status: 'CONFIRMADO'
              }
            });
            console.log(`✅ Saldo adicionado: +R$ ${valorLiquido.toFixed(2)}`);

            // 5. Processar comissões de afiliados (se houver)
            if (venda.afiliadoId && venda.plano?.comissaoAfiliado) {
              const valorComissao = (valorTotal * venda.plano.comissaoAfiliado) / 100;

              await prisma.comissao.create({
                data: {
                  afiliadoId: venda.afiliadoId,
                  vendaId: venda.id,
                  valor: valorComissao,
                  percentual: venda.plano.comissaoAfiliado,
                  status: 'PENDENTE'
                }
              });

              await prisma.carteira.create({
                data: {
                  usuarioId: venda.afiliadoId,
                  vendaId: venda.id,
                  tipo: 'COMISSAO',
                  valor: valorComissao,
                  descricao: `Comissão de ${venda.plano.comissaoAfiliado}% - Venda #${venda.id.substring(0,8)}`,
                  status: 'CONFIRMADO'
                }
              });

              console.log(`🤝 Comissão afiliado: R$ ${valorComissao.toFixed(2)}`);
            }

            console.log('🎉 Processamento financeiro completo!');
            
            return NextResponse.json({ status: 'PAGO' });
          } else {
            console.log('⏳ Ainda não foi pago no PaggPix');
          }
        } else {
          console.log('⚠️ Erro na resposta PaggPix:', verifyRes.statusText);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar no PaggPix:', error);
      }
    } else {
      console.log('⚠️ Venda sem pixId');
    }
    
    console.log('📤 Retornando status:', venda.status);
    return NextResponse.json({ status: venda.status });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({ error: 'Erro ao verificar pagamento' }, { status: 500 });
  }
}