import { Metadata } from 'next';
import { SeoService } from '@/lib/services/SeoService';
import { MovieService } from '@/lib/services/MovieService';
import { MovieCard } from '@/components/public/MovieCard';
import { Pagination } from '@/components/public/Pagination';
import { GenreService } from '@/lib/services/GenreService';
import Link from 'next/link';
import { Search, SlidersHorizontal, X } from 'lucide-react';

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
  const collectionSlug =
    typeof resolvedParams.collection === 'string' ? resolvedParams.collection : undefined;
  const sort = typeof resolvedParams.sort === 'string' ? resolvedParams.sort : 'createdAt_desc';
  const parsedPage =
    typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const itemsPerPage = 24;
  const skip = (page - 1) * itemsPerPage;

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'popularity_desc') orderBy = { popularity: 'desc' };
  if (sort === 'voteAverage_desc') orderBy = [{ voteAverage: 'desc' }, { voteCount: 'desc' }];
  if (sort === 'releaseDate_desc') orderBy = { releaseDate: 'desc' };
  if (sort === 'releaseDate_asc') orderBy = { releaseDate: 'asc' };
  if (sort === 'title_asc') orderBy = { title: 'asc' };
  if (sort === 'title_desc') orderBy = { title: 'desc' };

  const [{ data: movies, total: totalMovies }, genres] = await Promise.all([
    MovieService.searchMovies({
      skip,
      take: itemsPerPage,
      search: q,
      genreSlug,
      collectionSlug,
      orderBy,
    }),
    GenreService.listGenres(),
  ]);

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="mb-8 max-w-3xl sm:mb-10">
        <p className="eyebrow mb-3">Explore the catalog</p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          {q ? `Search results for "${q}"` : 'Browse Movies'}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">
            {totalMovies.toLocaleString()}
          </span>{' '}
          {totalMovies === 1 ? 'result' : 'results'} from the local catalog
        </p>
      </div>

      <form
        action="/search"
        method="get"
        className="cinema-panel mb-8 grid gap-3 rounded-2xl p-4 sm:grid-cols-2 sm:items-end sm:p-5 lg:mb-10 lg:grid-cols-[minmax(15rem,1fr)_minmax(10rem,.35fr)_minmax(10rem,.35fr)_auto]"
      >
        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          <span>Search title or synopsis</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Try: racing, space, mystery…"
              className="h-11 w-full rounded-xl border bg-background/70 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </span>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          <span>Genre</span>
          <select
            name="genre"
            defaultValue={genreSlug || ''}
            className="h-11 rounded-xl border bg-background/70 px-3 text-sm text-foreground outline-none transition focus:border-primary"
          >
            <option value="">All genres</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.slug}>
                {genre.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          <span>Sort by</span>
          <select
            name="sort"
            defaultValue={sort}
            className="h-11 rounded-xl border bg-background/70 px-3 text-sm text-foreground outline-none transition focus:border-primary"
          >
            <option value="popularity_desc">Most popular</option>
            <option value="voteAverage_desc">Top rated</option>
            <option value="createdAt_desc">Recently added</option>
            <option value="releaseDate_desc">Newest release</option>
            <option value="releaseDate_asc">Oldest release</option>
            <option value="title_asc">Title A–Z</option>
          </select>
        </label>
        <button className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[.98] lg:w-auto">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Apply
        </button>
      </form>

      <div>
        {movies.length > 0 ? (
          <>
            <div className="mb-10 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:mb-12 lg:grid-cols-6 lg:gap-y-8">
              {movies.map((movie, index) => (
                <MovieCard key={movie.id} movie={movie} priority={index < 4} />
              ))}
            </div>

            <Pagination currentPage={page} itemsPerPage={itemsPerPage} totalItems={totalMovies} />
          </>
        ) : (
          <div className="cinema-panel flex flex-col items-center justify-center rounded-2xl px-5 py-16 text-center sm:px-6 sm:py-24">
            <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-muted">
              <X className="h-6 w-6 text-muted-foreground" />
            </span>
            <p className="text-xl font-semibold">No matching movies</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Try a shorter title, a different genre, or reset the filters.
            </p>
            <Link
              href="/search"
              className="mt-6 text-sm font-semibold text-primary hover:underline"
            >
              Clear all filters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
