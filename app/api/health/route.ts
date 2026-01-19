import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verificação básica de saúde da aplicação
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Finora Gateway',
      environment: process.env.NODE_ENV || 'production'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: 'Health check failed'
    }, { status: 503 });
  }
}
