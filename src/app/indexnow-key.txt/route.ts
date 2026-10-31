import { isValidIndexNowKey } from '@/lib/indexnow';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const key = siteConfig.indexNowKey;
  if (!isValidIndexNowKey(key)) {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  return new Response(key, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
