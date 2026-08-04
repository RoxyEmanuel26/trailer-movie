import { NextResponse } from 'next/server';

export async function GET() {
  // A lightweight endpoint for load balancer readiness probes.
  // It simply returns 200 OK when the server is able to accept traffic.
  return NextResponse.json({ status: 'ready' }, { status: 200 });
}
