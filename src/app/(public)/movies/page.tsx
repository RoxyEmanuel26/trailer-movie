import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

interface Props { searchParams: Promise<{ page?: string | string[] }> }
export const revalidate = 3600;
const itemsPerPage = 24;

const getCachedMoviesPage = unstable_cache(
  async (page: number) => {
    const { data, total } = await MovieService.searchMovies({
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
      orderBy: [
        { releaseDate: { sort: 'desc', nulls: 'last' } },
        { popularity: 'desc' },
        { createdAt: 'desc' },
        { id: 'asc' },
      ],
    });
    // Cache only the fields the public cards render. Prisma Movie also contains
    // BigInt budget/revenue, which Next's data-cache JSON cannot serialize.
    return {
      total,
      data: data.map((movie) => ({
        id: movie.id,
        title: movie.title,
        slug: movie.slug,
        posterUrl: movie.posterUrl,
        releaseDate: movie.releaseDate?.toISOString() || null,
        runtimeMinutes: movie.runtimeMinutes,
        mpaaRating: movie.mpaaRating,
        voteAverage: movie.voteAverage,
      })),
    };
  },
  ['public-movies-pages-v1'],
  { revalidate: 300 },
);
const getMoviesPage = cache(async (page: number) => {
  const result = await getCachedMoviesPage(page);
  return {
    total: result.total,
    data: result.data.map((movie) => ({
      ...movie,
      releaseDate: movie.releaseDate ? new Date(movie.releaseDate) : null,
    })),
  };
});

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parseStrictPage((await searchParams).page);
  if (!page) notFound();
  const { total } = await getMoviesPage(page);
  if (isPageOutOfRange(page, total, 24)) notFound();
  return SeoService.generateMetadata('Page', 'movies', {
    title: `All Movies${page > 1 ? ` — Page ${page}` : ''}`,
    description: 'Browse every published movie in the local MovieFlix catalog, ordered from the newest releases to established favorites with trailers, cast, ratings, and genres.',
    path: pagePath('/movies', page),
  });
}

export default async function MoviesPage({ searchParams }: Props) {
  const page = parseStrictPage((await searchParams).page);
  if (!page) notFound();
  const { data, total } = await getMoviesPage(page);
  if (isPageOutOfRange(page, total, itemsPerPage)) notFound();
  return <CatalogPage eyebrow="Movie archive" title="All movies" description="Browse the newest movie releases first, followed by the rest of the published MovieFlix catalog. Open a title for its trailer, story, cast, crew, ratings, and available viewing providers." path="/movies" movies={data} totalMovies={total} currentPage={page} />;
}
