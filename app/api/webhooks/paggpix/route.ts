import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const VERIFY_TOKEN = process.env.PAGGPIX_WEBHOOK_TOKEN || 'finora-webhook-secure-token-2026';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const challenge = searchParams.get('challenge');
  const verifyToken = request.headers.get('x-verify-token');

  if (mode === 'subscribe' && verifyToken === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid verification' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paggpix-signature');
    const body = await request.text();

    // Verificar assinatura HMAC
    const hmac = crypto.createHmac('sha256', VERIFY_TOKEN);
    const expectedSignature = `sha256=${hmac.update(body).digest('hex')}`;

    if (signature !== expectedSignature) {
      console.error('❌ Assinatura inválida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const event = JSON.parse(body);
    console.log('📨 Webhook recebido:', event);

    // Processar evento de pagamento
    if (event.event === 'PAYMENT' && event.data) {
      const { pix_id, status, amount } = event.data;

      if (status === 'DONE') {
        // Buscar venda pelo pixId
        const venda = await prisma.venda.findFirst({
          where: { pixId: pix_id },
          include: {
            produto: {
              include: {
                usuario: true
              }
            },
            plano: true,
            afiliado: true
          }
        });

        if (!venda) {
          console.error('❌ Venda não encontrada para pixId:', pix_id);
          return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
        }

        if (venda.status === 'PAGO') {
          console.log('⚠️ Venda já estava paga:', venda.id);
          return NextResponse.json({ message: 'Já processado' }, { status: 200 });
        }

        // 1. Atualizar status da venda
        await prisma.venda.update({
          where: { id: venda.id },
          data: { 
            status: 'PAGO',
            dataPagamento: new Date()
          }
        });

        console.log('✅ Venda marcada como PAGA:', venda.id);

        // 2. Calcular valores
        const valorTotal = venda.valor;
        const taxaPlataforma = venda.plano?.taxaPlataforma || 5; // % padrão
        const valorTaxa = (valorTotal * taxaPlataforma) / 100;
        const valorLiquido = valorTotal - valorTaxa;

        // 3. Registrar taxa da plataforma na carteira
        await prisma.carteira.create({
          data: {
            usuarioId: venda.produto.usuarioId,
            vendaId: venda.id,
            tipo: 'TAXA_PLATAFORMA',
            valor: -valorTaxa, // Negativo porque é débito
            descricao: `Taxa de ${taxaPlataforma}% sobre venda #${venda.id.substring(0,8)}`,
            status: 'CONFIRMADO'
          }
        });

        console.log(`💰 Taxa plataforma registrada: R$ ${valorTaxa.toFixed(2)}`);

        // 4. Registrar valor líquido na carteira do vendedor
        await prisma.carteira.create({
          data: {
            usuarioId: venda.produto.usuarioId,
            vendaId: venda.id,
            tipo: 'VENDA',
            valor: valorLiquido,
            descricao: `Venda #${venda.id.substring(0,8)} - ${venda.produto.nome}`,
            status: 'CONFIRMADO'
          }
        });

        console.log(`✅ Saldo adicionado ao vendedor: R$ ${valorLiquido.toFixed(2)}`);

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

          console.log(`🤝 Comissão do afiliado: R$ ${valorComissao.toFixed(2)}`);
        }

        // 6. TODO: Enviar email de confirmação
        // await enviarEmailConfirmacao(venda);

        console.log('🎉 Processamento completo da venda:', venda.id);

        return NextResponse.json({ 
          success: true,
          vendaId: venda.id,
          valorTotal,
          valorTaxa,
          valorLiquido
        }, { status: 200 });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return NextResponse.json({ 
      error: 'Webhook error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
