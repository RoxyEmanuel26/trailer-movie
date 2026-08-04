import { NextResponse } from 'next/server';
import pkg from '../../../../package.json';

export async function GET() {
  return NextResponse.json(
    {
      version: pkg.version,
      name: pkg.name,
      commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'unknown',
    },
    { status: 200 }
  );
}
