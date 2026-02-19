import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ 
        error: 'Token e senha são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar usuário pelo token
    const user = await prisma.user.findUnique({
      where: { resetPasswordToken: token }
    });

    if (!user || !user.resetPasswordExpires) {
      return NextResponse.json({ 
        error: 'Token inválido ou expirado' 
      }, { status: 400 });
    }

    // Verificar se token expirou
    if (new Date() > user.resetPasswordExpires) {
      return NextResponse.json({ 
        error: 'Token expirado. Solicite um novo link' 
      }, { status: 400 });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha e limpar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        senha: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Senha alterada com sucesso!' 
    });

  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao redefinir senha' 
    }, { status: 500 });
  }
}