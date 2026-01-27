import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = body;
    
    console.log('📧 Email recebido:', email);
    
    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' }, 
        { status: 400 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' }, 
        { status: 404 }
      );
    }
    
    console.log('👤 Usuário encontrado:', user.email);
    
    const senhaHash = await bcrypt.hash(senha, 10);
    
    await prisma.user.update({
      where: { email },
      data: { senha: senhaHash }
    });
    
    console.log('✅ Senha atualizada com sucesso!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Senha atualizada! Faça login novamente.' 
    });
    
  } catch (error: any) {
    console.error('❌ Erro:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}