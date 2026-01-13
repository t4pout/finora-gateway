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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const { status, motivoRejeicao, userId: docUserId } = await request.json();

    // Atualizar documento
    await prisma.documento.update({
      where: { id },
      data: {
        status,
        motivoRejeicao
      }
    });

    // Se aprovado, verificar se todos documentos do usuário estão aprovados
    if (status === 'APROVADO' && docUserId) {
      const documentosUsuario = await prisma.documento.findMany({
        where: { userId: docUserId }
      });

      const todosAprovados = documentosUsuario.every(doc => 
        doc.id === id ? true : doc.status === 'APROVADO'
      );

      if (todosAprovados && documentosUsuario.length >= 1) {
        await prisma.user.update({
          where: { id: docUserId },
          data: {
            verificado: true,
            statusVerificacao: 'APROVADO'
          }
        });
      }
    }

    // Se rejeitado, atualizar status do usuário
    if (status === 'REJEITADO' && docUserId) {
      await prisma.user.update({
        where: { id: docUserId },
        data: {
          statusVerificacao: 'PENDENTE'
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar documento' }, { status: 500 });
  }
}
