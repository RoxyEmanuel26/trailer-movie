import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';

interface Props { searchParams: Promise<{ page?: string | string[] }> }
export const revalidate = 3600;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parseStrictPage((await searchParams).page);
  if (!page) notFound();
  const { total } = await MovieService.searchMovies({ take: 1 });
  if (isPageOutOfRange(page, total, 24)) notFound();
  return SeoService.generateMetadata('Page', 'movies', {
    title: `All Movies${page > 1 ? ` — Page ${page}` : ''}`,
    description: 'Browse every published movie in the local MovieFlix catalog, from recent additions to established favorites with trailers, cast, ratings, and genres.',
    path: pagePath('/movies', page),
  });
}

export default async function MoviesPage({ searchParams }: Props) {
  const page = parseStrictPage((await searchParams).page);
  if (!page) notFound();
  const itemsPerPage = 24;
  const { data, total } = await MovieService.searchMovies({ skip: (page - 1) * itemsPerPage, take: itemsPerPage, orderBy: [{ createdAt: 'desc' }, { popularity: 'desc' }] });
  if (isPageOutOfRange(page, total, itemsPerPage)) notFound();
  return <CatalogPage eyebrow="Movie archive" title="All movies" description="Explore every published movie in the local MovieFlix catalog. Open a title for its trailer, story, cast, crew, ratings, and available viewing providers." path="/movies" movies={data} totalMovies={total} currentPage={page} />;
}
