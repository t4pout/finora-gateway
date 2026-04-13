import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const admin = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const { id } = await params;
    const { senha } = await request.json();

    if (!senha || senha.length < 6) {
      return NextResponse.json({ error: 'Senha muito curta (mínimo 6 caracteres)' }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await prisma.user.update({
      where: { id },
      data: { senha: senhaHash }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao alterar senha' }, { status: 500 });
  }
}