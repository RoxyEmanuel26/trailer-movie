import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CollectionService } from '@/lib/services/CollectionService';
import { SeoService } from '@/lib/services/SeoService';
import { prisma } from '@/lib/prisma';
import { MovieCard } from '@/components/public/MovieCard';
import { Pagination } from '@/components/public/Pagination';
import { Layers } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const collection = await CollectionService.getBySlug(slug);
    return SeoService.generateMetadata('Collection', collection.id, {
      title: `${collection.title} Collection`,
      description: collection.description || `Explore the ${collection.title} collection.`,
      image: collection.coverImageUrl || undefined,
      path: `/collection/${collection.slug}`,
    });
  } catch (error) {
    return { title: 'Not Found' };
  }
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  
  let collection;
  try {
    collection = await CollectionService.getBySlug(slug);
  } catch (error) {
    notFound();
  }

  const currentPage = typeof page === 'string' ? parseInt(page) : 1;
  const itemsPerPage = 24;
  const skip = (currentPage - 1) * itemsPerPage;

  // We have collection.movies from getBySlug, but for pagination we should query explicitly
  const [collectionMovies, totalMovies] = await Promise.all([
    prisma.collectionMovie.findMany({
      where: {
        collectionId: collection.id,
        movie: { status: 'PUBLISHED' }
      },
      include: { movie: true },
      orderBy: { sortOrder: 'asc' },
      skip,
      take: itemsPerPage,
    }),
    prisma.collectionMovie.count({
      where: {
        collectionId: collection.id,
        movie: { status: 'PUBLISHED' }
      }
    }),
  ]);

  const movies = collectionMovies.map(cm => cm.movie);

  const jsonLd = SeoService.generateStructuredData('CollectionPage', {
    title: collection.title,
    description: collection.description,
    path: `/collection/${collection.slug}`,
  });

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      
      {/* Hero Section */}
      <section className="relative w-full h-[40vh] min-h-[300px] overflow-hidden bg-black flex flex-col justify-end border-b">
        {collection.coverImageUrl ? (
          <Image
            src={collection.coverImageUrl}
            alt={collection.title}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-50"
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <Layers className="w-24 h-24 text-muted-foreground opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="container relative mx-auto px-4 pb-8 z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-md">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="text-white/80 max-w-3xl text-lg drop-shadow">
              {collection.description}
            </p>
          )}
          <p className="text-sm font-medium mt-4 bg-primary text-primary-foreground inline-flex px-3 py-1 rounded-full shadow-sm">
            {totalMovies} {totalMovies === 1 ? 'Movie' : 'Movies'}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
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
