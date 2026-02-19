import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Por segurança, não revelar se o email existe
      return NextResponse.json({ 
        success: true,
        message: 'Se o email existir, você receberá um link de recuperação'
      });
    }

    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Expira em 1 hora

    // Salvar token no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      }
    });

    // URL do reset
    const resetUrl = `https://www.finorapayments.com/auth/reset-password?token=${token}`;

    console.log('🔑 Link de recuperação:', resetUrl);
    console.log('👤 Usuário:', user.email);

    // TODO: Enviar email (por enquanto só logamos)
    // Você pode integrar com SendGrid, AWS SES, etc

    return NextResponse.json({ 
      success: true,
      message: 'Se o email existir, você receberá um link de recuperação',
      // REMOVER em produção:
      resetUrl // Temporário para teste
    });

  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar solicitação' 
    }, { status: 500 });
  }
}