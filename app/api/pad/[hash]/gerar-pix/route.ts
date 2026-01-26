import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;

    // Buscar pedido
    const pedido = await prisma.pedidoPAD.findUnique({
      where: { hash }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já tem PIX gerado
    if (pedido.pixQrCode && pedido.pixCopiaECola) {
      return NextResponse.json({ pedido });
    }

    // Verificar se o pedido pode receber pagamento
    if (pedido.status !== 'APROVADO' && pedido.status !== 'ENVIADO') {
      return NextResponse.json(
        { error: 'Este pedido não pode receber pagamento no momento' },
        { status: 400 }
      );
    }

    // Gerar PIX usando PaggPix
    const pixData = {
      value: pedido.valor,
      description: `Pagamento PAD - ${pedido.produtoNome}`,
      expiresIn: 3600, // 1 hora
      buyer: {
        name: pedido.clienteNome,
        document: pedido.clienteCpfCnpj,
        email: pedido.clienteEmail || undefined,
        phone: pedido.clienteTelefone
      },
      metadata: {
        pedidoPADId: pedido.id,
        hash: pedido.hash,
        tipo: 'PAD'
      }
    };

    const paggPixResponse = await fetch('https://ws.pagg.one/sandbox/v1/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAGGPIX_API_KEY}`
      },
      body: JSON.stringify(pixData)
    });

    if (!paggPixResponse.ok) {
      const errorData = await paggPixResponse.json();
      console.error('❌ Erro PaggPix:', errorData);
      return NextResponse.json(
        { error: 'Erro ao gerar PIX' },
        { status: 500 }
      );
    }

    const pixResponse = await paggPixResponse.json();

    // Atualizar pedido com dados do PIX
    const pedidoAtualizado = await prisma.pedidoPAD.update({
      where: { id: pedido.id },
      data: {
        pixQrCode: pixResponse.qrCode,
        pixCopiaECola: pixResponse.qrCodeText,
        pixId: pixResponse.id
      }
    });

    console.log('✅ PIX gerado para pedido PAD:', hash);

    return NextResponse.json({
      success: true,
      pedido: pedidoAtualizado
    });

  } catch (error) {
    console.error('❌ Erro ao gerar PIX:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PIX' },
      { status: 500 }
    );
  }
}