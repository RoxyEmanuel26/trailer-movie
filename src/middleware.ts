import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bot Protection & User Agent Inspection
  const userAgent = request.headers.get('user-agent') || '';
  const isMaliciousBot = /curl|python-requests|postman|scraper|wget|httpx|http-client/i.test(userAgent);

  if (!userAgent || isMaliciousBot) {
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';
    console.warn(`[MIDDLEWARE_BOT_BLOCK] Blocked IP: ${ip} | UA: ${userAgent}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Only protect admin routes for now.
  // Note: This is a "soft" redirect check for UX. It does not cryptographically verify 
  // the session token at the edge (due to database/crypto limitations in Edge runtime). 
  // Cryptographic and DB validation is enforced securely inside `requireAdmin()` on API 
  // routes and Server Components (like AdminLayout).
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const sessionCookie =
      request.cookies.get('trailer-movie.session_token')?.value ||
      request.cookies.get('__Secure-trailer-movie.session_token')?.value ||
      request.cookies.get('better-auth.session_token')?.value;

    if (!sessionCookie) {
      // If it's an API request, return 401
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Redirect to login for UI
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
