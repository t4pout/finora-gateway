import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { put } from '@vercel/blob';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

function verificarToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const formData = await request.formData();
    const arquivo = formData.get('arquivo') as File;
    const tipo = formData.get('tipo') as string;

    if (!arquivo || !tipo) {
      return NextResponse.json({ error: 'Arquivo e tipo obrigatórios' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!tiposPermitidos.includes(arquivo.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPG, PNG ou PDF.' }, { status: 400 });
    }

    // Validar tamanho (10MB)
    if (arquivo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 });
    }

    // Upload para Vercel Blob
    const filename = `documentos/${userId}/${tipo}-${Date.now()}-${arquivo.name}`;
    const blob = await put(filename, arquivo, {
      access: 'public',
      addRandomSuffix: false
    });

    // Criar registro no banco
    const documento = await prisma.documento.create({
      data: {
        tipo,
        arquivo: blob.url,
        userId,
        status: 'PENDENTE'
      }
    });

    // Atualizar status do usuário
    await prisma.user.update({
      where: { id: userId },
      data: { statusVerificacao: 'EM_ANALISE' }
    });

    return NextResponse.json({ success: true, documento });
  } catch (error: any) {
    console.error('Erro upload documento:', error);
    return NextResponse.json({ error: error.message || 'Erro ao fazer upload' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const documentos = await prisma.documento.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ documentos });
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar documentos' }, { status: 500 });
  }
}