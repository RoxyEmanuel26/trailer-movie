import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GenreService } from '@/lib/services/GenreService';
import { SeoService } from '@/lib/services/SeoService';
import { prisma } from '@/lib/prisma';
import { MovieCard } from '@/components/public/MovieCard';
import { Pagination } from '@/components/public/Pagination';

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

  const currentPage = typeof page === 'string' ? parseInt(page) : 1;
  const itemsPerPage = 24;
  const skip = (currentPage - 1) * itemsPerPage;

  const [movies, totalMovies] = await Promise.all([
    prisma.movie.findMany({
      where: {
        status: 'PUBLISHED',
        genres: { some: { genreId: genre.id } },
      },
      orderBy: { releaseDate: 'desc' },
      skip,
      take: itemsPerPage,
    }),
    prisma.movie.count({
      where: {
        status: 'PUBLISHED',
        genres: { some: { genreId: genre.id } },
      }
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 border-b pb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">{genre.name} Movies</h1>
        {genre.description && (
          <p className="text-muted-foreground max-w-3xl">{genre.description}</p>
        )}
        <p className="text-sm font-medium mt-4 bg-muted inline-flex px-3 py-1 rounded-full">
          {totalMovies} Movies
        </p>
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
          <p className="text-lg text-muted-foreground">No movies found in this genre yet.</p>
        </div>
      )}
    </div>
  );
}
