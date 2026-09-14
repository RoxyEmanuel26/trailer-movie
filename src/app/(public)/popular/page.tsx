import type { Metadata } from 'next';
import { CatalogHub } from '@/components/public/CatalogHub';
import { POPULAR_CATALOG } from '@/lib/public-catalog';
import { SeoService } from '@/lib/services/SeoService';
import { MovieService } from '@/lib/services/MovieService';

export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'popular', { title: 'Popular Movie Rankings', description: 'Compare MovieFlix rankings for popular, top-rated, newly released, and recently added movies using clearly defined local catalog signals.', path: '/popular' });
}
export default async function PopularHubPage() {
  const counts = await Promise.all(POPULAR_CATALOG.map(async (item) => {
    const result = item.slug === 'top-rated'
      ? await MovieService.searchTopRatedMovies({ take: 1 })
      : await MovieService.searchMovies({ take: 1, ...(item.slug === 'latest-releases' ? { releaseDateLte: new Date() } : {}) });
    return [item.slug, result.total] as const;
  }));
  const countBySlug = new Map(counts);
  return <CatalogHub eyebrow="Movie rankings" title="Popular ways to discover movies" description="Choose a ranking based on catalog popularity, audience ratings, release date, or the date a title was added to MovieFlix." path="/popular" items={POPULAR_CATALOG.map((item) => ({ href: `/popular/${item.slug}`, title: item.label, description: item.description, count: countBySlug.get(item.slug) }))} />;
}
