import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json(
    {
      name: 'MovieFlix',
      release: process.env.APP_RELEASE_SHA || 'development',
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
