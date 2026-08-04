import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes for now
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
