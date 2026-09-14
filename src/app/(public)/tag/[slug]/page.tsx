import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TagService } from '@/lib/services/TagService';
import { SeoService } from '@/lib/services/SeoService';
import { MovieService } from '@/lib/services/MovieService';
import { MovieCard } from '@/components/public/MovieCard';
import { Pagination } from '@/components/public/Pagination';
import { Hash } from 'lucide-react';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  try {
    const tag = await TagService.getBySlug(slug);
    const page = parseStrictPage(query.page);
    if (!page) notFound();
    const { total } = await MovieService.searchMovies({ tagSlug: tag.slug, take: 1 });
    if (isPageOutOfRange(page, total, 24)) notFound();
    return SeoService.generateMetadata('Tag', tag.id, {
      title: `Movies tagged with ${tag.name}${page > 1 ? ` — Page ${page}` : ''}`,
      description: `Browse movies tagged with ${tag.name}.`,
      path: pagePath(`/tag/${tag.slug}`, page),
      indexable: false,
    });
  } catch (error) {
    notFound();
  }
}

export const revalidate = 3600;

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;

  let tag;
  try {
    tag = await TagService.getBySlug(slug);
  } catch (error) {
    notFound();
  }

  const currentPage = parseStrictPage(page);
  if (!currentPage) notFound();
  const itemsPerPage = 24;
  const skip = (currentPage - 1) * itemsPerPage;

  const { data: movies, total: totalMovies } = await MovieService.searchMovies({
    tagSlug: tag.slug,
    status: 'PUBLISHED',
    skip,
    take: itemsPerPage,
    orderBy: { releaseDate: 'desc' },
  });
  if (isPageOutOfRange(currentPage, totalMovies, itemsPerPage)) notFound();

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="mb-10 flex items-center gap-5">
        <div className="rounded-2xl bg-primary/10 p-4 text-primary">
          <Hash className="w-8 h-8" />
        </div>
        <div>
          <p className="eyebrow mb-2">Catalog tag</p>
          <h1 className="break-words text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {tag.name}
          </h1>
          <p className="text-sm font-medium mt-2 text-muted-foreground">
            {totalMovies.toLocaleString()} {totalMovies === 1 ? 'movie' : 'movies'}
          </p>
        </div>
      </div>

      {movies.length > 0 ? (
        <>
          <div className="mb-10 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:mb-12 lg:grid-cols-6 lg:gap-y-8">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalMovies}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg text-muted-foreground">No movies found with this tag.</p>
        </div>
      )}
    </div>
  );
}
