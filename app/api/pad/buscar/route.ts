import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cpfCnpj = searchParams.get('cpfCnpj');

    if (!cpfCnpj) {
      return NextResponse.json(
        { error: 'CPF ou CNPJ é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar pedidos pelo CPF/CNPJ
    const pedidos = await prisma.pedidoPAD.findMany({
      where: {
        clienteCpfCnpj: cpfCnpj
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`🔍 Busca por CPF/CNPJ: ${cpfCnpj} - ${pedidos.length} pedido(s) encontrado(s)`);

    return NextResponse.json({ pedidos });

  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}