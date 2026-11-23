import type { Metadata } from 'next';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { WatchlistClient, type SharedWatchlistMovie } from '@/components/public/WatchlistClient';
import { parseSharedWatchlistIds } from '@/lib/watchlist';
import { absoluteUrl, organizationSchemaId, siteConfig, websiteSchemaId } from '@/lib/site-config';
import { JsonLd } from '@/components/seo/JsonLd';

interface PageProps {
  searchParams: Promise<{ ids?: string | string[] }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = await searchParams;
  const sharedIds = parseSharedWatchlistIds(query.ids);
  const isShared = sharedIds.length > 0;

  return SeoService.generateMetadata('Page', 'watchlist', {
    title: isShared
      ? `Shared Movie Watchlist (${sharedIds.length} ${sharedIds.length === 1 ? 'Film' : 'Films'}) | ${siteConfig.name}`
      : 'My Movie Watchlist — Save & Share Trailers Without an Account',
    description: isShared
      ? 'View a shared MovieFlix movie watchlist with official trailers, ratings, runtimes, and where to stream.'
      : 'Build your personal movie watchlist right in your browser—no login required—and share your curated picks with friends via a single link.',
    path: '/watchlist',
    indexable: !isShared,
  });
}

export default async function WatchlistPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const sharedIds = parseSharedWatchlistIds(query.ids);
  const isSharedView = sharedIds.length > 0;

  const rawShared = isSharedView ? await MovieService.getSharedWatchlistMovies(sharedIds) : [];
  const sharedMovies: SharedWatchlistMovie[] = rawShared.map((movie) => ({
    id: movie.id,
    tmdbId: movie.tmdbId ?? null,
    slug: movie.slug,
    title: movie.title,
    posterUrl: movie.posterUrl,
    releaseYear: movie.releaseDate ? new Date(movie.releaseDate).getUTCFullYear() : null,
    runtimeMinutes: movie.runtimeMinutes ?? null,
    voteAverage: movie.voteAverage ?? null,
  }));

  const canonicalUrl = absoluteUrl('/watchlist');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: 'My Movie Watchlist',
        description: 'Zero-login personal and shareable movie watchlist on MovieFlix.',
        isPartOf: { '@id': websiteSchemaId() },
        publisher: { '@id': organizationSchemaId() },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Watchlist', item: canonicalUrl },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <JsonLd data={jsonLd} />

      <nav
        aria-label="Breadcrumb"
        className="mb-7 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-foreground">
          Watchlist
        </span>
      </nav>

      <header className="mb-8 max-w-3xl sm:mb-10">
        <p className="eyebrow mb-3 flex items-center gap-2">
          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Zero-Login Personal Watchlist</span>
        </p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          {isSharedView ? 'Shared Movie Watchlist' : 'My Watchlist'}
        </h1>
        <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg">
          {isSharedView
            ? 'Explore this curated movie list, watch official trailers, or import every title into your own browser Watchlist.'
            : 'Save upcoming releases and movie night picks straight to your browser without creating an account, then share your list anywhere with one link.'}
        </p>
      </header>

      <WatchlistClient
        sharedMovies={sharedMovies}
        isSharedView={isSharedView}
        siteUrl={siteConfig.url}
      />
    </div>
  );
}
