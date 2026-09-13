import type { ComponentProps } from 'react';
import Link from 'next/link';
import { Film } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { Pagination } from './Pagination';
import { SeoService } from '@/lib/services/SeoService';

type CatalogMovie = ComponentProps<typeof MovieCard>['movie'];

interface CatalogPageProps {
  eyebrow: string;
  title: string;
  description: string;
  path: string;
  movies: CatalogMovie[];
  totalMovies: number;
  currentPage: number;
  itemsPerPage?: number;
  emptyMessage?: string;
  breadcrumbs?: Array<{ name: string; path: string }>;
}

export function CatalogPage({
  eyebrow,
  title,
  description,
  path,
  movies,
  totalMovies,
  currentPage,
  itemsPerPage = 24,
  emptyMessage = 'No movies are available in this section yet.',
  breadcrumbs = [],
}: CatalogPageProps) {
  const breadcrumbItems = [{ name: 'Home', path: '/' }, ...breadcrumbs, { name: title, path }];
  const jsonLd = [
    SeoService.generateStructuredData('CollectionPage', { title, description, path }),
    SeoService.generateStructuredData('BreadcrumbList', { items: breadcrumbItems }),
  ];

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <nav
        aria-label="Breadcrumb"
        className="mb-7 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground"
      >
        {breadcrumbItems.map((item, index) => (
          <span key={item.path} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {index === breadcrumbItems.length - 1 ? (
              <span aria-current="page" className="text-foreground">
                {item.name}
              </span>
            ) : (
              <Link href={item.path} className="transition-colors hover:text-primary">
                {item.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <header className="mb-8 max-w-3xl sm:mb-10">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">
            {totalMovies.toLocaleString()}
          </span>{' '}
          {totalMovies === 1 ? 'movie' : 'movies'}
        </p>
      </header>

      {movies.length ? (
        <>
          <div className="mb-10 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:mb-12 lg:grid-cols-6 lg:gap-y-8">
            {movies.map((movie, index) => (
              <MovieCard key={movie.id} movie={movie} priority={index < 4} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalMovies}
          />
        </>
      ) : (
        <div className="cinema-panel flex flex-col items-center justify-center rounded-2xl px-5 py-16 text-center sm:px-6 sm:py-24">
          <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-muted">
            <Film className="h-6 w-6 text-muted-foreground" />
          </span>
          <p className="text-xl font-semibold">No movies found</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{emptyMessage}</p>
          <Link href="/search" className="mt-6 text-sm font-semibold text-primary hover:underline">
            Browse all movies
          </Link>
        </div>
      )}
    </div>
  );
}
