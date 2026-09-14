import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GenreService } from '@/lib/services/GenreService';
import { SeoService } from '@/lib/services/SeoService';
import { MovieService } from '@/lib/services/MovieService';
import { CatalogPage } from '@/components/public/CatalogPage';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { catalogInsightFacts } from '@/lib/catalog-insights';

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
    const { total } = await MovieService.searchMovies({ genreSlug: genre.slug, take: 1 });
    if (isPageOutOfRange(page, total, 24)) notFound();
    return SeoService.generateMetadata('Genre', genre.id, {
      title: `${genre.name} Movies${page > 1 ? ` — Page ${page}` : ''}`,
      description: genre.description || `Browse the best ${genre.name} movies and trailers.`,
      path: pagePath(`/genre/${genre.slug}`, page),
      indexable: total >= 3 && Boolean(genre.description?.trim()),
    });
  } catch (error) {
    notFound();
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
    notFound();
  }

  const currentPage = parseStrictPage(page);
  if (!currentPage) notFound();
  const itemsPerPage = 24;
  const skip = (currentPage - 1) * itemsPerPage;

  const { data: movies, total: totalMovies } = await MovieService.searchMovies({
    genreSlug: genre.slug,
    status: 'PUBLISHED',
    skip,
    take: itemsPerPage,
    orderBy: { releaseDate: 'desc' },
  });
  if (isPageOutOfRange(currentPage, totalMovies, itemsPerPage)) notFound();
  const stats = await MovieService.getCatalogStats({ genreSlug: genre.slug });

  const description =
    genre.description ||
    `Browse ${genre.name.toLowerCase()} movies and trailers from the local catalog.`;

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
    />
  );
}
