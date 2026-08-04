import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TagService } from '@/lib/services/TagService';
import { SeoService } from '@/lib/services/SeoService';
import { prisma } from '@/lib/prisma';
import { MovieCard } from '@/components/public/MovieCard';
import { Pagination } from '@/components/public/Pagination';
import { Hash } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const tag = await TagService.getBySlug(slug);
    return SeoService.generateMetadata('Tag', tag.id, {
      title: `Movies tagged with ${tag.name}`,
      description: `Browse movies tagged with ${tag.name}.`,
      path: `/tag/${tag.slug}`,
    });
  } catch (error) {
    return { title: 'Not Found' };
  }
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  
  let tag;
  try {
    tag = await TagService.getBySlug(slug);
  } catch (error) {
    notFound();
  }

  const currentPage = typeof page === 'string' ? parseInt(page) : 1;
  const itemsPerPage = 24;
  const skip = (currentPage - 1) * itemsPerPage;

  const [movies, totalMovies] = await Promise.all([
    prisma.movie.findMany({
      where: {
        status: 'PUBLISHED',
        tags: { some: { tagId: tag.id } },
      },
      orderBy: { releaseDate: 'desc' },
      skip,
      take: itemsPerPage,
    }),
    prisma.movie.count({
      where: {
        status: 'PUBLISHED',
        tags: { some: { tagId: tag.id } },
      }
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 border-b pb-8 flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-full text-primary">
          <Hash className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{tag.name}</h1>
          <p className="text-sm font-medium mt-2 text-muted-foreground">
            {totalMovies} {totalMovies === 1 ? 'Movie' : 'Movies'}
          </p>
        </div>
      </div>

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
          <p className="text-lg text-muted-foreground">No movies found with this tag.</p>
        </div>
      )}
    </div>
  );
}
