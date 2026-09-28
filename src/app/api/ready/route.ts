import { NextResponse } from 'next/server';

import { HealthService } from '@/lib/services/HealthService';

export async function GET() {
  try {
    // Ping DB to ensure application is ready to serve traffic
    await HealthService.checkDatabase();

    return NextResponse.json({
      status: 'ready',
      release: process.env.APP_RELEASE_SHA || 'development',
    }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Readiness check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Service is not ready',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
