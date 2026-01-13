import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { writeFile } from 'fs/promises';
import path from 'path';

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

    const formData = await request.formData();
    const arquivo = formData.get('arquivo') as File;
    const tipo = formData.get('tipo') as string;

    if (!arquivo || !tipo) {
      return NextResponse.json({ error: 'Arquivo e tipo obrigatórios' }, { status: 400 });
    }

    // Converter arquivo para buffer
    const bytes = await arquivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Salvar arquivo
    const filename = `${Date.now()}-${arquivo.name}`;
    const filepath = path.join(process.cwd(), 'public', 'uploads', 'documentos', filename);
    await writeFile(filepath, buffer);

    // Criar registro no banco
    const documento = await prisma.documento.create({
      data: {
        tipo,
        arquivo: `/uploads/documentos/${filename}`,
        userId,
        status: 'PENDENTE'
      }
    });

    // Atualizar status do usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        statusVerificacao: 'EM_ANALISE'
      }
    });

    return NextResponse.json({ success: true, documento });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const documentos = await prisma.documento.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ documentos });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar documentos' }, { status: 500 });
  }
}
