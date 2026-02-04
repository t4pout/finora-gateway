import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function gerarHash(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let hash = '';
  for (let i = 0; i < 8; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 Dados recebidos:', body);

    const {
      planoId,
      produtoId,
      valor,
      nome,
      clienteNome,
      clienteCpfCnpj,
      clienteTelefone,
      clienteEmail,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      quantidade = 1
    } = body;

    // Validações
    if (!clienteNome || !clienteCpfCnpj || !clienteTelefone) {
      return NextResponse.json(
        { error: 'Dados do cliente são obrigatórios' },
        { status: 400 }
      );
    }

    if (!cep || !rua || !numero || !bairro || !cidade || !estado) {
      return NextResponse.json(
        { error: 'Endereço completo é obrigatório' },
        { status: 400 }
      );
    }

    if (!produtoId || !valor) {
      return NextResponse.json(
        { error: 'Dados do produto são obrigatórios' },
        { status: 400 }
      );
    }

    // ✅ VALIDAÇÃO: Verificar se já existe pedido em análise com esse CPF
    const pedidoExistente = await prisma.pedidoPAD.findFirst({
      where: {
        clienteCpfCnpj,
        status: 'EM_ANALISE'
      }
    });

    if (pedidoExistente) {
      return NextResponse.json(
        { 
          error: 'Você já possui um pedido em análise. Aguarde a aprovação ou cancelamento antes de fazer um novo pedido.',
          pedidoHash: pedidoExistente.hash
        },
        { status: 400 }
      );
    }

    // Buscar o produto
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId }
    });

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Gerar hash único
    let hash = gerarHash();
    let tentativas = 0;
    while (tentativas < 10) {
      const existe = await prisma.pedidoPAD.findUnique({
        where: { hash }
      });
      if (!existe) break;
      hash = gerarHash();
      tentativas++;
    }

    // Criar pedido PAD
    // Buscar código de afiliado (cookie ou query)
    const afiliadoCode = request.cookies.get('afiliado_code')?.value;
    let afiliacaoId = null;
    
    if (afiliadoCode) {
      try {
        const afiliacao = await prisma.afiliacao.findUnique({
          where: { codigo: afiliadoCode }
        });
        if (afiliacao && afiliacao.status === 'ATIVO') {
          afiliacaoId = afiliacao.id;
          console.log('✅ Afiliado detectado:', afiliadoCode);
        }
      } catch (error) {
        console.error('Erro ao buscar afiliação:', error);
      }
    }

    const pedido = await prisma.pedidoPAD.create({
      data: {
        hash,
        clienteNome,
        clienteCpfCnpj,
        clienteTelefone,
        clienteEmail: clienteEmail || null,
        cep,
        rua,
        numero,
        complemento: complemento || null,
        bairro,
        cidade,
        estado,
        produtoId,
        produtoNome: nome || produto.nome,
        produtoImagem: produto.imagem || null,
        vendedorId: produto.userId,
        valor: parseFloat(valor.toString()),
        quantidade,
        status: 'EM_ANALISE'
      }
    });

    console.log('✅ Pedido PAD criado:', pedido);

    // Enviar notificação Telegram
    try {
      await fetch(`${request.nextUrl.origin}/api/telegram/notificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: vendedor.telegramBotToken,
          chatId: vendedor.telegramChatId,
          mensagem: `🔔 <b>PEDIDO GERADO PAD</b>\n\n💰 Valor: R$ ${pedido.valor.toFixed(2)}\n👤 Cliente: ${pedido.clienteNome}\n📦 Produto: ${pedido.produtoNome}\n🔗 Hash: ${pedido.hash}`
        })
      });
    } catch (e) {
      console.error('Erro ao enviar notificação:', e);
    }

    return NextResponse.json({
      success: true,
      pedido,
      message: 'Pedido criado com sucesso!'
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar pedido PAD:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pedido', details: error.message },
      { status: 500 }
    );
  }
}