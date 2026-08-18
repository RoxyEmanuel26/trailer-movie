import { NextResponse } from 'next/server';

import { HealthService } from '@/lib/services/HealthService';

export async function GET() {
  try {
    // Ping DB to ensure application is ready to serve traffic
    await HealthService.checkDatabase();

    return NextResponse.json({ 
      status: 'ready',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
    }, { status: 200 });
  } catch (error) {
    console.error('Readiness check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Service is not ready',
      },
      { status: 503 }
    );
  }
}
