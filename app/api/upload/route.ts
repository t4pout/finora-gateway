import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const tiposPermitidos = ['image/', 'application/pdf', 'application/epub+zip', 'application/zip'];
    const tipoValido = tiposPermitidos.some(tipo => file.type.startsWith(tipo));
    if (!tipoValido) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 });
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const filename = `uploads/${timestamp}-${randomString}.${extension}`;

    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log('✅ Upload realizado com sucesso:', blob.url);
    return NextResponse.json({ success: true, url: blob.url });

  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error);
    return NextResponse.json({ 
      error: 'Erro ao fazer upload',
      details: String(error)
    }, { status: 500 });
  }
}