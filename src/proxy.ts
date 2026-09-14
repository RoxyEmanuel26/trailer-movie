import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { siteConfig } from '@/lib/site-config';
import { MovieRepository } from '@/lib/repositories/MovieRepository';
import { PersonRepository } from '@/lib/repositories/PersonRepository';
import { moviePath, personPath } from '@/lib/public-routes';

const legacyIdPattern = /^c[a-z0-9]{20,}$/i;
const paginatedPublicPath = /^\/(?:movies|search|genre\/[^/]+|origin\/[^/]+|year\/[^/]+|popular\/[^/]+|collection\/[^/]+|tag\/[^/]+)$/;

function invalidPaginationResponse() {
  return new NextResponse(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Page Not Found | MovieFlix</title><style>body{margin:0;background:#0d0e0c;color:#f8f4ec;font:16px/1.6 system-ui,sans-serif}main{min-height:100dvh;display:grid;place-content:center;text-align:center;padding:24px}p{max-width:480px;color:#aaa79f}a{display:inline-block;margin-top:16px;padding:12px 18px;border-radius:12px;background:#e65335;color:white;text-decoration:none;font-weight:700}</style></head><body><main><h1>Page Not Found</h1><p>The page number must be a positive whole number. Return to the MovieFlix catalog and choose an available page.</p><a href="/movies">Browse movies</a></main></body></html>',
    {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(':')[0].toLowerCase();
  const canonicalHost = new URL(siteConfig.url).hostname.toLowerCase();

  if (process.env.NODE_ENV === 'production' && requestHost === 'movieflix.site' && canonicalHost === 'www.movieflix.site') {
    const canonical = new URL(`${pathname}${request.nextUrl.search}`, siteConfig.url);
    return NextResponse.redirect(canonical, 308);
  }

  if (request.nextUrl.searchParams.has('page')) {
    const page = request.nextUrl.searchParams.get('page') || '';
    if (paginatedPublicPath.test(pathname) && !/^[1-9]\d*$/.test(page)) {
      return invalidPaginationResponse();
    }
  }

  const movieParam = pathname.startsWith('/watch/') ? pathname.slice('/watch/'.length) : '';
  if (/^-\d+$/.test(movieParam)) {
    return NextResponse.redirect(new URL(moviePath(movieParam), request.url), 308);
  }
  if (legacyIdPattern.test(movieParam)) {
    const canonicalSlug = await MovieRepository.resolveCanonicalSlug(movieParam);
    if (canonicalSlug) return NextResponse.redirect(new URL(moviePath(canonicalSlug), request.url), 308);
  }

  const personParam = pathname.startsWith('/person/') ? pathname.slice('/person/'.length) : '';
  if (legacyIdPattern.test(personParam)) {
    const canonicalSlug = await PersonRepository.resolveCanonicalSlug(personParam);
    if (canonicalSlug) return NextResponse.redirect(new URL(personPath(canonicalSlug), request.url), 308);
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

  const response = NextResponse.next();
  if (!siteConfig.indexingEnabled || requestHost !== canonicalHost || pathname.startsWith('/api/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
