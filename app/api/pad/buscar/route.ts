import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cpfCnpj = searchParams.get('cpfCnpj') || searchParams.get('cpf');

    if (!cpfCnpj) {
      return NextResponse.json(
        { error: 'CPF ou CNPJ é obrigatório' },
        { status: 400 }
      );
    }

    // Remover espaços, pontos, traços do CPF/CNPJ para busca
    const cpfCnpjLimpo = cpfCnpj.replace(/\D/g, '');

    // Buscar pedidos usando LIKE para ignorar formatação
    const pedidos = await prisma.$queryRaw`
      SELECT * FROM "PedidoPAD"
      WHERE REPLACE(REPLACE(REPLACE("clienteCpfCnpj", ' ', ''), '.', ''), '-', '') = ${cpfCnpjLimpo}
      ORDER BY "createdAt" DESC
    `;

    console.log(`🔍 Busca por CPF/CNPJ: ${cpfCnpj} (limpo: ${cpfCnpjLimpo}) - ${pedidos.length} pedido(s) encontrado(s)`);

    return NextResponse.json({ pedidos });
   
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}