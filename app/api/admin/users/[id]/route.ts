import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

function verificarAdmin(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
    return decoded.userId;
  } catch { return null; }
}

// GET — buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = verificarAdmin(request);
    if (!adminId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, nome: true, email: true, telefone: true, cpf: true,
        role: true, status: true, telegramBotToken: true, telegramChatId: true,
        createdAt: true, verificado: true, statusVerificacao: true,
        planoTaxa: { select: { id: true, nome: true } },
        _count: { select: { produtos: true, vendas: true } }
      }
    });

    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PATCH — editar usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = verificarAdmin(request);
    if (!adminId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const { id } = await params;
    const { nome, email, telefone, cpf, role, status, telegramBotToken, telegramChatId } = await request.json();

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(email && { email }),
        ...(telefone !== undefined && { telefone }),
        ...(cpf !== undefined && { cpf }),
        ...(role && { role }),
        ...(status && { status }),
        ...(telegramBotToken !== undefined && { telegramBotToken }),
        ...(telegramChatId !== undefined && { telegramChatId }),
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

// DELETE — excluir usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = verificarAdmin(request);
    if (!adminId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const { id } = await params;
    if (id === adminId) return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}