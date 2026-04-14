import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Gerar nome único no servidor para garantir
        const ext = pathname.split('.').pop();
        const nomeUnico = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        
        return {
          allowedContentTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/epub+zip', 'application/zip'
          ],
          maximumSizeInBytes: 50 * 1024 * 1024,
          pathname: nomeUnico,
          tokenPayload: JSON.stringify({ pathname: nomeUnico }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('✅ Upload direto concluído:', blob.url);
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}