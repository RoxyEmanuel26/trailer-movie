import { Metadata } from 'next';
import { SeoService } from '@/lib/services/SeoService';
import { MovieService } from '@/lib/services/MovieService';
import { MovieCard } from '@/components/public/MovieCard';
import { Pagination } from '@/components/public/Pagination';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'search', {
    title: 'Search Movies',
    description: 'Search and filter through our extensive collection of movie trailers.',
    path: '/search',
  });
}

export default async function SearchPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const genreSlug = typeof resolvedParams.genre === 'string' ? resolvedParams.genre : undefined;
  const collectionSlug = typeof resolvedParams.collection === 'string' ? resolvedParams.collection : undefined;
  const status = typeof resolvedParams.status === 'string' ? resolvedParams.status : 'PUBLISHED';
  const sort = typeof resolvedParams.sort === 'string' ? resolvedParams.sort : 'createdAt_desc';
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
  
  const itemsPerPage = 24;
  const skip = (page - 1) * itemsPerPage;

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'popularity_desc') orderBy = { popularity: 'desc' };
  if (sort === 'voteAverage_desc') orderBy = [{ voteAverage: 'desc' }, { voteCount: 'desc' }];
  if (sort === 'releaseDate_desc') orderBy = { releaseDate: 'desc' };
  if (sort === 'releaseDate_asc') orderBy = { releaseDate: 'asc' };
  if (sort === 'title_asc') orderBy = { title: 'asc' };
  if (sort === 'title_desc') orderBy = { title: 'desc' };

  const { data: movies, total: totalMovies } = await MovieService.searchMovies({
    skip,
    take: itemsPerPage,
    search: q,
    status: status === 'ALL' ? undefined : status,
    genreSlug,
    collectionSlug,
    orderBy,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 border-b pb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          {q ? `Search results for "${q}"` : 'Browse Movies'}
        </h1>
        <p className="text-sm font-medium mt-4 bg-muted inline-flex px-3 py-1 rounded-full">
          {totalMovies} {totalMovies === 1 ? 'Result' : 'Results'}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar (Very basic for now, handled entirely via URLs) */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Sort By</h3>
            <div className="flex flex-col space-y-2 text-sm">
              <a href={`?${new URLSearchParams({ ...resolvedParams as Record<string, string>, sort: 'popularity_desc' })}`} className={sort === 'popularity_desc' ? 'font-bold text-primary' : 'hover:underline'}>Most Popular</a>
              <a href={`?${new URLSearchParams({ ...resolvedParams as Record<string, string>, sort: 'voteAverage_desc' })}`} className={sort === 'voteAverage_desc' ? 'font-bold text-primary' : 'hover:underline'}>Top Rated</a>
              <a href={`?${new URLSearchParams({ ...resolvedParams as Record<string, string>, sort: 'createdAt_desc' })}`} className={sort === 'createdAt_desc' ? 'font-bold text-primary' : 'hover:underline'}>Recently Added</a>
              <a href={`?${new URLSearchParams({ ...resolvedParams as Record<string, string>, sort: 'releaseDate_desc' })}`} className={sort === 'releaseDate_desc' ? 'font-bold text-primary' : 'hover:underline'}>Newest Release</a>
              <a href={`?${new URLSearchParams({ ...resolvedParams as Record<string, string>, sort: 'releaseDate_asc' })}`} className={sort === 'releaseDate_asc' ? 'font-bold text-primary' : 'hover:underline'}>Oldest Release</a>
              <a href={`?${new URLSearchParams({ ...resolvedParams as Record<string, string>, sort: 'title_asc' })}`} className={sort === 'title_asc' ? 'font-bold text-primary' : 'hover:underline'}>Title A-Z</a>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          {movies.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
              
              <Pagination 
                currentPage={page}
                itemsPerPage={itemsPerPage}
                totalItems={totalMovies}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/20">
              <p className="text-lg font-semibold">No results found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
