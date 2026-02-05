import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { nome, email, senha, tipo } = await request.json();

    // Validações
    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const userExists = await prisma.user.findUnique({
      where: { email }
    });

    if (userExists) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        tipo: tipo || 'VENDEDOR'
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso!',
      user
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
