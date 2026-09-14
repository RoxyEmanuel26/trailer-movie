import type { Metadata } from 'next';
import { CatalogHub } from '@/components/public/CatalogHub';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';

export const revalidate = 3600;
export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'years', { title: 'Movies by Release Year', description: 'Browse published movies and trailers by their original release year, then compare stories, cast, ratings, genres, and viewing information.', path: '/years' });
}
export default async function YearsPage() {
  const years = await MovieService.listPublishedReleaseYearStats();
  const items = years.map((item) => ({ href: `/year/${item.year}`, title: String(item.year), description: `Explore movies released in ${item.year}, ordered by release date and catalog popularity.`, count: Number(item.count) }));
  return <CatalogHub eyebrow="Browse the timeline" title="Movies by release year" description="Move through the MovieFlix timeline and discover published films grouped by their original release year." path="/years" items={items} />;
}
