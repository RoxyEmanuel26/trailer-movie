import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GenreService } from '@/lib/services/GenreService';
import { SeoService } from '@/lib/services/SeoService';
import { MovieService } from '@/lib/services/MovieService';
import { CatalogPage } from '@/components/public/CatalogPage';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const genre = await GenreService.getBySlug(slug);
    return SeoService.generateMetadata('Genre', genre.id, {
      title: `${genre.name} Movies`,
      description: genre.description || `Browse the best ${genre.name} movies and trailers.`,
      path: `/genre/${genre.slug}`,
    });
  } catch (error) {
    return { title: 'Not Found' };
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

  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : 1;
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const itemsPerPage = 24;
  const skip = (currentPage - 1) * itemsPerPage;

  const { data: movies, total: totalMovies } = await MovieService.searchMovies({
    genreSlug: genre.slug,
    status: 'PUBLISHED',
    skip,
    take: itemsPerPage,
    orderBy: { releaseDate: 'desc' },
  });

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
    />
  );
}
