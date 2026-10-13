import type { Metadata } from 'next';
import { CatalogHub } from '@/components/public/CatalogHub';
import { POPULAR_CATALOG } from '@/lib/public-catalog';
import { SeoService } from '@/lib/services/SeoService';
import { MovieService } from '@/lib/services/MovieService';

export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'popular', { title: 'Popular Movie Rankings', description: 'Explore MovieFlix rankings for audience favorites, highly rated movies, and the latest releases.', path: '/popular' });
}
export default async function PopularHubPage() {
  const counts = await MovieService.getPopularHubCounts();
  const countBySlug = new Map([
    ['most-popular', counts.mostPopular],
    ['top-rated', counts.topRated],
    ['latest-releases', counts.latestReleases],
  ]);
  return <CatalogHub eyebrow="Movie rankings" title="Popular ways to discover movies" description="Choose how you want to explore: audience favorites, highly rated movies, or the latest releases." path="/popular" items={POPULAR_CATALOG.map((item) => ({ href: `/popular/${item.slug}`, title: item.label, description: item.description, count: countBySlug.get(item.slug) }))} />;
}
