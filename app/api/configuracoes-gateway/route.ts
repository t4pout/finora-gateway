import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const configs = await prisma.configuracaoGateway.findMany({
      orderBy: { metodo: 'asc' }
    });

    // Se não existir config, retorna os padrões
    const metodos = ['PIX', 'BOLETO', 'CARTAO'];
    const defaults: any = { PIX: 'PAGGPIX', BOLETO: 'MERCADOPAGO', CARTAO: 'MERCADOPAGO' };

    const resultado = metodos.map(metodo => {
      const config = configs.find(c => c.metodo === metodo);
      return config || { metodo, gateway: defaults[metodo], ativo: true };
    });

    return NextResponse.json({ configs: resultado });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metodo, gateway } = body;

    if (!metodo || !gateway) {
      return NextResponse.json({ error: 'metodo e gateway são obrigatórios' }, { status: 400 });
    }

    const config = await prisma.configuracaoGateway.upsert({
      where: { metodo },
      update: { gateway, updatedAt: new Date() },
      create: { metodo, gateway }
    });

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}