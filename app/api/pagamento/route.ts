import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PAGGPIX_TOKEN = process.env.PAGGPIX_TOKEN;
const PAGGPIX_API = 'https://public-api.paggpix.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planoId, compradorNome, compradorEmail, compradorCpf, compradorTel, cep, rua, numero, complemento, bairro, cidade, estado } = body;

    // Buscar plano e produto
    const plano = await prisma.planoOferta.findUnique({
      where: { id: planoId },
      include: { produto: true }
    });

    if (!plano || !plano.ativo) {
      return NextResponse.json({ error: 'Plano não encontrado ou inativo' }, { status: 404 });
    }

    // PRIMEIRO: Criar venda no banco (SEM pixId ainda)
    const venda = await prisma.venda.create({
      data: {
        valor: plano.preco,
        status: 'PENDENTE',
        metodoPagamento: 'PIX',
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
        produtoId: plano.produtoId,
        vendedorId: plano.produto.userId
      }
    });

    // SEGUNDO: Criar cobrança no PaggPix usando o ID da venda como external_id
    const paggpixData = {
      cnpj: "35254464000109",
      value: plano.preco.toFixed(2),
      description: `${plano.nome} - ${plano.produto.nome}`,
      external_id: venda.id  // USAR ID DA VENDA (único)
    };

    console.log('Enviando para PaggPix:', paggpixData);

    const paggpixResponse = await fetch(`${PAGGPIX_API}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGGPIX_TOKEN}`
      },
      body: JSON.stringify(paggpixData)
    });

    const responseText = await paggpixResponse.text();
    console.log('Resposta PaggPix:', responseText);

    if (!paggpixResponse.ok) {
      console.error('Erro PaggPix:', responseText);
      return NextResponse.json({ 
        error: 'Erro ao criar cobrança PIX',
        details: responseText
      }, { status: 500 });
    }

    const paggpixResult = JSON.parse(responseText);

    // TERCEIRO: Atualizar venda com dados do PIX
    await prisma.venda.update({
      where: { id: venda.id },
      data: {
        pixId: paggpixResult.pix_id,
        pixQrCode: paggpixResult.qrcode_image,
        pixCopiaECola: paggpixResult.pix_code
      }
    });

    return NextResponse.json({
      vendaId: venda.id,
      pixId: paggpixResult.pix_id,
      qrCode: paggpixResult.qrcode_image,
      copiaECola: paggpixResult.pix_code,
      valor: plano.preco
    });
  } catch (error: any) {
    console.error('Erro ao criar pagamento:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar pagamento',
      details: error.message 
    }, { status: 500 });
  }
}