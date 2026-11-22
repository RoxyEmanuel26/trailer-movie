import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { GenreService } from '@/lib/services/GenreService';
import { SeoService } from '@/lib/services/SeoService';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl, organizationSchemaId, websiteSchemaId } from '@/lib/site-config';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'genres', {
    title: 'Movie Genres — Browse All Categories',
    description: 'Browse every movie genre available in MovieFlix and open locally indexed collections with trailers, cast, ratings, and related discovery links.',
    path: '/genres',
  });
}

export default async function GenresPage() {
  const genres = await GenreService.listGenresWithPublishedCounts();
  const path = '/genres';
  const fullUrl = absoluteUrl(path);
  const title = 'Every movie genre';
  const description = 'Browse every movie genre available in the MovieFlix catalog.';
  const listId = `${fullUrl}#genres`;
  const jsonLd = [
    {
      '@type': 'CollectionPage',
      '@id': `${fullUrl}#page`,
      url: fullUrl,
      name: title,
      description,
      isPartOf: { '@id': websiteSchemaId() },
      publisher: { '@id': organizationSchemaId() },
      mainEntity: { '@id': listId },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${fullUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Genres', item: fullUrl },
      ],
    },
    {
      '@type': 'ItemList',
      '@id': listId,
      name: 'Movie genres on MovieFlix',
      numberOfItems: genres.length,
      itemListElement: genres.map((genre, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `${genre.name} Movies`,
        url: absoluteUrl(`/genre/${genre.slug}`),
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <JsonLd data={{ '@context': 'https://schema.org', '@graph': jsonLd }} />
      <nav
        aria-label="Breadcrumb"
        className="mb-7 flex items-center gap-2 text-xs font-medium text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-foreground">
          Genres
        </span>
      </nav>
      <header className="mb-8 max-w-3xl sm:mb-12">
        <p className="eyebrow mb-3">Explore by mood</p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg">
          Move from high-energy action to quiet drama, animation, documentary, and everything in
          between.
        </p>
      </header>
      <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {genres.map((genre, index) => (
          <Link
            key={genre.id}
            href={`/genre/${genre.slug}`}
            className="group flex min-h-24 items-end justify-between bg-card p-4 transition-colors hover:bg-accent active:bg-accent sm:min-h-32 sm:p-6"
          >
            <div>
              <span className="mb-4 block text-xs tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="text-xl font-semibold tracking-[-0.03em] group-hover:text-primary">
                {genre.name}
              </h2>
              <p className="mt-2 text-xs font-semibold tabular-nums text-muted-foreground">
                {genre._count.movies.toLocaleString()} {genre._count.movies === 1 ? 'movie' : 'movies'}
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground transition duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
