import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, ChevronDown, Compass, Film, Flame, Sparkles } from 'lucide-react';
import { MovieCard } from '@/components/public/MovieCard';
import { Pagination } from '@/components/public/Pagination';
import { JsonLd } from '@/components/seo/JsonLd';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { absoluteUrl, organizationSchemaId, websiteSchemaId } from '@/lib/site-config';
import { moviePath } from '@/lib/public-routes';
import { buildFaqJsonLd } from '@/lib/movie-aeo';
import {
  buildUpcomingHubFaqs,
  formatReleaseCountdown,
  formatUpcomingDateShort,
  parseUpcomingRegion,
  UPCOMING_REGIONS,
  type UpcomingRegionFilter,
} from '@/lib/upcoming-guides';

interface PageProps {
  searchParams: Promise<{ page?: string | string[]; region?: string | string[] }>;
}

export const revalidate = 1800;
const ITEMS_PER_PAGE = 24;

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = await searchParams;
  const page = parseStrictPage(query.page);
  if (!page) notFound();
  const region = parseUpcomingRegion(query.region);
  const regionCfg = UPCOMING_REGIONS[region];

  const [{ total }, upcomingYears] = await Promise.all([
    MovieService.getPublicCatalogPage({
      page,
      itemsPerPage: ITEMS_PER_PAGE,
      upcomingOnly: true,
      countryCodes: regionCfg.countryCodes.length ? regionCfg.countryCodes : undefined,
      orderBy: [{ releaseDate: 'asc' }, { popularity: 'desc' }, { id: 'asc' }],
    }),
    MovieService.listUpcomingReleaseYears(),
  ]);

  if (page > 1 && isPageOutOfRange(page, total, ITEMS_PER_PAGE)) notFound();

  const yearSpan =
    upcomingYears.length >= 2
      ? `${upcomingYears[0].year}–${upcomingYears[upcomingYears.length - 1].year}`
      : upcomingYears[0]
        ? String(upcomingYears[0].year)
        : String(new Date().getUTCFullYear());

  return SeoService.generateMetadata('Page', 'upcoming', {
    title: `Upcoming Movies & Official Trailers (${yearSpan}) — Release Calendar${page > 1 ? ` — Page ${page}` : ''}`,
    description:
      'Watch verified official trailers for the most anticipated upcoming movies across the US, Europe, and Asia. Track theatrical release dates, countdowns, casts, and synopses.',
    image: '/upcoming/opengraph-image',
    path: pagePath('/upcoming', page),
    indexable: region === 'all' && total > 0,
  });
}

export default async function UpcomingMoviesPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const currentPage = parseStrictPage(query.page);
  if (!currentPage) notFound();
  const region = parseUpcomingRegion(query.region);
  const regionCfg = UPCOMING_REGIONS[region];
  const countryCodes = regionCfg.countryCodes.length ? regionCfg.countryCodes : undefined;

  const [{ data: movies, total }, spotlightResult, upcomingYears] = await Promise.all([
    MovieService.getPublicCatalogPage({
      page: currentPage,
      itemsPerPage: ITEMS_PER_PAGE,
      upcomingOnly: true,
      countryCodes,
      orderBy: [{ releaseDate: 'asc' }, { popularity: 'desc' }, { id: 'asc' }],
    }),
    currentPage === 1
      ? MovieService.getPublicCatalogPage({
          page: 1,
          itemsPerPage: 6,
          upcomingOnly: true,
          countryCodes,
          orderBy: [{ popularity: 'desc' }, { releaseDate: 'asc' }, { id: 'asc' }],
        })
      : Promise.resolve({ data: [], total: 0 }),
    MovieService.listUpcomingReleaseYears(),
  ]);

  if (currentPage > 1 && isPageOutOfRange(currentPage, total, ITEMS_PER_PAGE)) notFound();

  const spotlightMovies = spotlightResult.data;
  const highlights = (spotlightMovies.length > 0 ? spotlightMovies : movies).map((m) => m.title);
  const faqs = buildUpcomingHubFaqs({ total, highlights });

  const canonicalPath = pagePath('/upcoming', currentPage);
  const canonicalFullUrl = absoluteUrl(canonicalPath);
  const listId = `${canonicalFullUrl}#upcoming-movies`;
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Upcoming Movies', path: '/upcoming' },
    ...(currentPage > 1 ? [{ name: `Page ${currentPage}`, path: canonicalPath }] : []),
  ];

  const faqNode = currentPage === 1 && region === 'all' ? buildFaqJsonLd(canonicalFullUrl, faqs) : null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalFullUrl}#webpage`,
        url: canonicalFullUrl,
        name:
          currentPage > 1
            ? `Upcoming Movies & Official Trailers — Page ${currentPage}`
            : 'Upcoming Movies & Official Trailers',
        description:
          'Verified upcoming theatrical releases with official YouTube trailers, release dates, and cast guides across the US, Europe, and Asia.',
        isPartOf: { '@id': websiteSchemaId() },
        publisher: { '@id': organizationSchemaId() },
        mainEntity: { '@id': listId },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalFullUrl}#breadcrumb`,
        itemListElement: breadcrumbItems.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: absoluteUrl(item.path),
        })),
      },
      {
        '@type': 'ItemList',
        '@id': listId,
        name: 'Upcoming Movies Release Calendar',
        numberOfItems: movies.length,
        itemListElement: movies.map((movie, index) => ({
          '@type': 'ListItem',
          position: (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
          url: absoluteUrl(moviePath(movie.slug)),
          name: movie.title,
          ...(movie.posterUrl ? { image: movie.posterUrl } : {}),
        })),
      },
      ...(faqNode ? [faqNode] : []),
    ],
  };

  const regionOrder: UpcomingRegionFilter[] = ['all', 'us', 'europe', 'asia'];

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <JsonLd data={jsonLd} />

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

      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow mb-3 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Global Theatrical Release Calendar</span>
          </p>
          <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Upcoming Movies &amp; Official Trailers
          </h1>
          <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg">
            Every upcoming movie below already has a verified official trailer, poster, synopsis, and scheduled release window across North America, Europe, and Asia.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">
              {total.toLocaleString('en-US')}
            </span>{' '}
            verified upcoming {total === 1 ? 'release' : 'releases'}
            {region !== 'all' ? ` in ${regionCfg.label}` : ' worldwide'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {upcomingYears.map((entry) => (
            <Link
              key={entry.year}
              href={`/upcoming/${entry.year}`}
              prefetch={false}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border bg-card px-3.5 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              <span>{entry.year} Releases</span>
              <span className="text-xs font-normal tabular-nums text-muted-foreground">
                {entry.count.toLocaleString('en-US')}
              </span>
            </Link>
          ))}
          <Link
            href="/tonight"
            prefetch={false}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Pick a movie for tonight</span>
          </Link>
        </div>
      </header>

      {/* Regional Filter Tabs */}
      <div
        role="navigation"
        aria-label="Filter upcoming releases by region"
        className="mb-8 flex flex-wrap items-center gap-2 border-b pb-5"
      >
        {regionOrder.map((key) => {
          const item = UPCOMING_REGIONS[key];
          const active = region === key;
          const href = key === 'all' ? '/upcoming' : `/upcoming?region=${key}`;
          return (
            <Link
              key={key}
              href={href}
              rel={key === 'all' ? undefined : 'nofollow'}
              prefetch={false}
              className={`inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-foreground text-background shadow-sm'
                  : 'border bg-card/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Most Anticipated Spotlight Strip (Page 1 only) */}
      {currentPage === 1 && spotlightMovies.length > 0 ? (
        <section aria-labelledby="most-anticipated-heading" className="mb-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
                <Flame className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 id="most-anticipated-heading" className="text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                  Most Anticipated Trailers
                </h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Highest-buzz upcoming releases ranked by global audience anticipation
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
            {spotlightMovies.map((movie, index) => (
              <MovieCard
                key={`spotlight-${movie.id}`}
                movie={movie}
                priority={index < 6}
                badge={formatReleaseCountdown(movie.releaseDate) || formatUpcomingDateShort(movie.releaseDate)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Chronological Release Calendar */}
      <section aria-labelledby="release-schedule-heading">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="release-schedule-heading" className="text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
            {region === 'all'
              ? 'Chronological Release Schedule'
              : `${regionCfg.label} Release Schedule`}
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Ordered soonest theatrical debut first
          </p>
        </div>

        {movies.length > 0 ? (
          <>
            <div className="mb-10 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:mb-12 lg:grid-cols-6 lg:gap-y-8">
              {movies.map((movie, index) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  priority={currentPage > 1 && index < 6}
                  badge={formatUpcomingDateShort(movie.releaseDate)}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={total}
            />
          </>
        ) : (
          <div className="cinema-panel flex flex-col items-center justify-center rounded-2xl px-5 py-16 text-center sm:px-6 sm:py-24">
            <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-muted">
              <Film className="h-6 w-6 text-muted-foreground" />
            </span>
            <p className="text-xl font-semibold">No upcoming releases found for this region yet</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Switch back to the global release calendar to browse all verified upcoming movie trailers.
            </p>
            <Link href="/upcoming" className="mt-6 text-sm font-semibold text-primary hover:underline">
              View global upcoming releases
            </Link>
          </div>
        )}
      </section>

      {/* Related Guides */}
      <section
        aria-labelledby="upcoming-related-heading"
        className="mt-12 rounded-2xl border bg-card/55 p-5 sm:mt-14 sm:p-7"
      >
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <Compass className="h-4 w-4" aria-hidden="true" />
          <h2 id="upcoming-related-heading">Explore release guides &amp; tools</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {upcomingYears.map((entry) => (
            <Link
              key={`rel-${entry.year}`}
              href={`/upcoming/${entry.year}`}
              prefetch={false}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border bg-background/80 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <span>Upcoming {entry.year} movies</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {entry.count.toLocaleString('en-US')}
              </span>
            </Link>
          ))}
          <Link
            href="/popular/latest-releases"
            prefetch={false}
            className="inline-flex min-h-10 items-center rounded-xl border bg-background/80 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            Latest Theatrical &amp; Streaming Releases
          </Link>
          <Link
            href="/tonight"
            prefetch={false}
            className="inline-flex min-h-10 items-center rounded-xl border bg-background/80 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            What to Watch Tonight Picker
          </Link>
          <Link
            href="/watchlist"
            prefetch={false}
            className="inline-flex min-h-10 items-center rounded-xl border bg-background/80 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            My Watchlist
          </Link>
          <Link
            href="/streaming"
            prefetch={false}
            className="inline-flex min-h-10 items-center rounded-xl border bg-background/80 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            Where to Stream
          </Link>
        </div>
      </section>

      {/* FAQ Accordion */}
      {currentPage === 1 && faqs.length > 0 ? (
        <section aria-labelledby="upcoming-faq-heading" className="mt-10 max-w-4xl sm:mt-12">
          <h2 id="upcoming-faq-heading" className="mb-4 text-xl font-semibold tracking-[-0.025em]">
            Frequently asked questions
          </h2>
          <div className="divide-y overflow-hidden rounded-2xl border bg-card/50">
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                open={index === 0}
                className="group/faq px-5 py-4 transition-colors open:bg-card/90"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground sm:text-base [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open/faq:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-2.5 max-w-[68ch] text-sm leading-6 text-muted-foreground sm:leading-7">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
