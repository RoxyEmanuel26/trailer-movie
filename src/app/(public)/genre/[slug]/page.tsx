import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GenreService } from '@/lib/services/GenreService';
import { SeoService } from '@/lib/services/SeoService';
import { MovieService } from '@/lib/services/MovieService';
import { CatalogPage } from '@/components/public/CatalogPage';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { catalogInsightFacts } from '@/lib/catalog-insights';
import { NotFoundError } from '@/lib/errors';
import { ORIGIN_CATALOG } from '@/lib/public-catalog';
import { STREAMING_CATALOG } from '@/lib/streaming-catalog';
import { getRelatedGuidesForGenre } from '@/lib/programmatic-guides';

const GENRE_ORDER_BY = [
  { releaseDate: { sort: 'desc' as const, nulls: 'last' as const } },
  { popularity: 'desc' as const },
  { createdAt: 'desc' as const },
  { id: 'asc' as const },
];

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  try {
    const genre = await GenreService.getBySlug(slug);
    const page = parseStrictPage(query.page);
    if (!page) notFound();
    const { total } = await MovieService.getPublicCatalogPage({
      page,
      itemsPerPage: 24,
      genreSlug: genre.slug,
      orderBy: GENRE_ORDER_BY,
    });
    if (isPageOutOfRange(page, total, 24)) notFound();
    return SeoService.generateMetadata('Genre', genre.id, {
      title: `${genre.name} Movies${page > 1 ? ` — Page ${page}` : ''}`,
      description: genre.description || `Browse the best ${genre.name} movies and trailers.`,
      path: pagePath(`/genre/${genre.slug}`, page),
      indexable: total >= 3 && Boolean(genre.description?.trim()),
    });
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export const revalidate = 3600;

export default async function GenrePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;

  let genre;
  try {
    genre = await GenreService.getBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const currentPage = parseStrictPage(page);
  if (!currentPage) notFound();
  const itemsPerPage = 24;

  const [{ data: movies, total: totalMovies }, stats, facetGuides] = await Promise.all([
    MovieService.getPublicCatalogPage({
      page: currentPage,
      itemsPerPage,
      genreSlug: genre.slug,
      orderBy: GENRE_ORDER_BY,
    }),
    MovieService.getCatalogStats({ genreSlug: genre.slug }),
    MovieService.getIndexableFacetGuides().catch(() => null),
  ]);
  if (isPageOutOfRange(currentPage, totalMovies, itemsPerPage)) notFound();

  const description =
    genre.description ||
    `Browse ${genre.name.toLowerCase()} movies, trailers, and related discoveries on MovieFlix.`;
  const relatedLinks = facetGuides
    ? getRelatedGuidesForGenre(
        genre,
        facetGuides,
        new Map(STREAMING_CATALOG.map((item) => [item.slug, item])),
        new Map(ORIGIN_CATALOG.map((item) => [item.slug, item])),
      )
    : [];

  return (
    <CatalogPage
      eyebrow="Genre collection"
      title={`${genre.name} movies`}
      description={description}
      path={`/genre/${genre.slug}`}
      movies={movies}
      totalMovies={totalMovies}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      emptyMessage="No movies have been published in this genre yet."
      breadcrumbs={[{ name: 'Genres', path: '/genres' }]}
      facts={catalogInsightFacts(stats)}
      relatedHeading={`Explore ${genre.name.toLowerCase()} movies by year, platform & origin`}
      relatedLinks={relatedLinks}
    />
  );
}
