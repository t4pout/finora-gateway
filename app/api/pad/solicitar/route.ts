import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função para gerar hash único
function gerarHash(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let hash = '';
  for (let i = 0; i < 8; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos obrigatórios
    const camposObrigatorios = [
      'clienteNome', 'clienteCpfCnpj', 'clienteTelefone',
      'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado',
      'produtoId', 'produtoNome', 'valor'
    ];

    for (const campo of camposObrigatorios) {
      if (!body[campo]) {
        return NextResponse.json(
          { error: `Campo ${campo} é obrigatório` },
          { status: 400 }
        );
      }
    }

    // Buscar produto para pegar o vendedorId
    const produto = await prisma.produto.findUnique({
      where: { id: body.produtoId },
      select: { 
        userId: true,
        padHabilitado: true
      }
    });

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    if (!produto.padHabilitado) {
      return NextResponse.json(
        { error: 'Este produto não aceita pedidos PAD' },
        { status: 403 }
      );
    }

    // Gerar hash único
    let hash = gerarHash();
    let hashExiste = await prisma.pedidoPAD.findUnique({
      where: { hash }
    });

    // Se hash já existe, gerar outro
    while (hashExiste) {
      hash = gerarHash();
      hashExiste = await prisma.pedidoPAD.findUnique({
        where: { hash }
      });
    }

    // Criar pedido PAD
    const pedido = await prisma.pedidoPAD.create({
      data: {
        hash,
        clienteNome: body.clienteNome,
        clienteCpfCnpj: body.clienteCpfCnpj.replace(/\D/g, ''),
        clienteTelefone: body.clienteTelefone,
        clienteEmail: body.clienteEmail || null,
        cep: body.cep,
        rua: body.rua,
        numero: body.numero,
        complemento: body.complemento || null,
        bairro: body.bairro,
        cidade: body.cidade,
        estado: body.estado,
        produtoId: body.produtoId,
        produtoNome: body.produtoNome,
        produtoImagem: body.produtoImagem || null,
        valor: parseFloat(body.valor),
        quantidade: body.quantidade || 1,
        vendedorId: produto.userId,
        status: 'EM_ANALISE'
      }
    });

    console.log('✅ Pedido PAD criado:', pedido.hash);

    return NextResponse.json({
      success: true,
      pedido: {
        hash: pedido.hash,
        status: pedido.status
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar pedido PAD:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pedido' },
      { status: 500 }
    );
  }
}