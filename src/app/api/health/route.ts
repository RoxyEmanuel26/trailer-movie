import { NextResponse } from 'next/server';
import { HealthService } from '@/lib/services/HealthService';

export async function GET() {
  try {
    // Ping DB
    await HealthService.checkDatabase();

    return NextResponse.json(
      {
        status: 'ok',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Service is unhealthy',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
