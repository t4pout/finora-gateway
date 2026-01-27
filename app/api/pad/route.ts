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

    const {
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
      produtoId,
      produtoNome,
      valor,
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

    // Buscar o produto para pegar o vendedorId e imagem
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
    produtoNome,
    produtoImagem: produto.imagem || null,
    valor,
    quantidade,
    status: 'EM_ANALISE',
    vendedorId: produto.userId
  }
});

// Disparar pixels de conversão (PAD criado)
try {
  const { dispararPixelsProduto } = await import('@/lib/pixels');
  await dispararPixelsProduto(
    produtoId,
    'COMPRA',
    'PAD',
    {
      email: clienteEmail || undefined,
      telefone: clienteTelefone,
      nome: clienteNome,
      cidade,
      estado,
      cep,
      valor,
      produtoNome
    }
  );
} catch (error) {
  console.error('Erro ao disparar pixels:', error);
  // Não falhar a criação do pedido se o pixel falhar
}

return NextResponse.json({
  success: true,
  pedido: {
    id: pedido.id,
    hash: pedido.hash,
    status: pedido.status,
    valor: pedido.valor
  }
});

  } catch (error: any) {
    console.error('Erro ao criar pedido PAD:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pedido', details: error.message },
      { status: 500 }
    );
  }
}