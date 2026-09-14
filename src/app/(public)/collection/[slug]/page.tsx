import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CollectionService } from '@/lib/services/CollectionService';
import { SeoService } from '@/lib/services/SeoService';
import { MovieService } from '@/lib/services/MovieService';
import { MovieCard } from '@/components/public/MovieCard';
import { Pagination } from '@/components/public/Pagination';
import { Layers } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  try {
    const collection = await CollectionService.getBySlug(slug);
    const page = parseStrictPage(query.page);
    if (!page) notFound();
    const { total } = await MovieService.searchMovies({ collectionSlug: collection.slug, take: 1 });
    if (isPageOutOfRange(page, total, 24)) notFound();
    return SeoService.generateMetadata('Collection', collection.id, {
      title: `${collection.title} Collection${page > 1 ? ` — Page ${page}` : ''}`,
      description: collection.description || `Explore the ${collection.title} collection.`,
      image: collection.coverImageUrl || undefined,
      path: pagePath(`/collection/${collection.slug}`, page),
      indexable: total >= 3 && Boolean(collection.description?.trim()),
    });
  } catch (error) {
    notFound();
  }
}

export const revalidate = 3600;

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;

  let collection;
  try {
    collection = await CollectionService.getBySlug(slug);
  } catch (error) {
    notFound();
  }

  const currentPage = parseStrictPage(page);
  if (!currentPage) notFound();
  const itemsPerPage = 24;
  const skip = (currentPage - 1) * itemsPerPage;

  const { data: movies, total: totalMovies } = await MovieService.searchMovies({
    collectionSlug: collection.slug,
    status: 'PUBLISHED',
    skip,
    take: itemsPerPage,
    orderBy: { releaseDate: 'desc' },
  });
  if (isPageOutOfRange(currentPage, totalMovies, itemsPerPage)) notFound();

  const jsonLd = SeoService.generateStructuredData('CollectionPage', {
    title: collection.title,
    description: collection.description,
    path: `/collection/${collection.slug}`,
  });

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}

      {/* Hero Section */}
      <section className="relative flex min-h-[20rem] w-full flex-col justify-end overflow-hidden bg-[#0d0e0c] sm:min-h-[23rem] lg:min-h-[25rem]">
        {collection.coverImageUrl ? (
          <Image
            src={collection.coverImageUrl}
            alt={collection.title}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <Layers className="w-24 h-24 text-muted-foreground opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e0c] via-[#0d0e0c]/55 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-[90rem] px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#f48a6f]">
            Curated collection
          </p>
          <h1 className="mb-3 max-w-4xl break-words text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-5xl lg:text-7xl">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="line-clamp-4 max-w-3xl text-sm leading-6 text-white/80 drop-shadow sm:text-base sm:leading-7 lg:line-clamp-none lg:text-lg">
              {collection.description}
            </p>
          )}
          <p className="text-sm font-medium mt-4 bg-primary text-primary-foreground inline-flex px-3 py-1 rounded-full shadow-sm">
            {totalMovies} {totalMovies === 1 ? 'Movie' : 'Movies'}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
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
            <p className="text-lg text-muted-foreground">No movies found in this collection yet.</p>
          </div>
        )}
      </div>
    </>
  );
}
