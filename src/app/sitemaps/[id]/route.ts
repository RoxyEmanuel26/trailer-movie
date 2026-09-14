import { notFound } from 'next/navigation';
import { SeoService } from '@/lib/services/SeoService';
import { serializeSitemap, xmlResponse } from '@/lib/sitemap-xml';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id === 'core') {
    return xmlResponse(serializeSitemap(await SeoService.generateSitemapData()));
  }

  const movieMatch = id.match(/^movies-(\d+)$/);
  if (movieMatch) {
    const page = Number(movieMatch[1]);
    const pageCount = await SeoService.getMovieSitemapPageCount();
    if (!Number.isSafeInteger(page) || page < 0 || page >= pageCount) notFound();
    return xmlResponse(serializeSitemap(await SeoService.generateMovieSitemapData(page)));
  }

  const match = id.match(/^people-(\d+)$/);
  if (!match) notFound();

  const page = Number(match[1]);
  const pageCount = await SeoService.getPersonSitemapPageCount();
  if (!Number.isSafeInteger(page) || page < 0 || page >= pageCount) notFound();

  return xmlResponse(serializeSitemap(await SeoService.generatePersonSitemapData(page)));
}
