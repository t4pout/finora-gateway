import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

function verificarToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { paginaId, versaoOriginalId, distribuicao } = await request.json();

    if (!paginaId || !versaoOriginalId || distribuicao === undefined) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Ativar teste A/B na página
    await prisma.paginaOferta.update({
      where: { id: paginaId },
      data: {
        testeAB: true,
        versaoOriginal: versaoOriginalId,
        distribuicao: distribuicao
      }
    });

    // Configurar a outra versão
    await prisma.paginaOferta.update({
      where: { id: versaoOriginalId },
      data: {
        testeAB: true,
        versaoOriginal: paginaId,
        distribuicao: 100 - distribuicao
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao ativar teste A/B' }, { status: 500 });
  }
}
