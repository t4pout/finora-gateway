import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

export async function POST(request: NextRequest) {
  console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('🔍 DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50));
  try {
    const { email, senha } = await request.json();

    // ValidaçÃµes
    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuÃ¡rio
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha invÃ¡lidos' },
        { status: 401 }
      );
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Email ou senha invÃ¡lidos' },
        { status: 401 }
      );
    }

    // Verificar status
    if (user.status !== 'ATIVO') {
      return NextResponse.json(
        { error: 'Conta inativa ou bloqueada' },
        { status: 403 }
      );
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retornar dados do usuÃ¡rio (sem senha)
    const userData = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      createdAt: user.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}

