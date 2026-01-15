import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + "...",
    hasUrl: !!process.env.DATABASE_URL
  });
}
