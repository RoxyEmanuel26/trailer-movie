import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Clock, Layers } from 'lucide-react';
import { CollectionService } from '@/lib/services/CollectionService';
import { SeoService } from '@/lib/services/SeoService';
import { Pagination } from '@/components/public/Pagination';
import { JsonLd } from '@/components/seo/JsonLd';
import { cleanFranchiseName, formatMarathonRuntime } from '@/lib/franchise-guides';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { absoluteUrl, organizationSchemaId, websiteSchemaId } from '@/lib/site-config';

interface Props {
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 3600;
const ITEMS_PER_PAGE = 24;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parseStrictPage((await searchParams).page);
  if (!page) notFound();
  const { total } = await CollectionService.listActiveFranchiseGuides(page, ITEMS_PER_PAGE);
  if (total > 0 && isPageOutOfRange(page, total, ITEMS_PER_PAGE)) notFound();
  return SeoService.generateMetadata('Page', 'collections', {
    title: `Movie Franchises & Watch Order Guides${page > 1 ? ` — Page ${page}` : ''}`,
    description:
      'Browse complete chronological movie franchise watch orders, marathon runtimes, official trailers, and streaming guides on MovieFlix.',
    path: pagePath('/collections', page),
    indexable: total > 0,
  });
}

export default async function CollectionsHubPage({ searchParams }: Props) {
  const page = parseStrictPage((await searchParams).page);
  if (!page) notFound();

  const { items, total } = await CollectionService.listActiveFranchiseGuides(page, ITEMS_PER_PAGE);
  if (total > 0 && isPageOutOfRange(page, total, ITEMS_PER_PAGE)) notFound();

  const canonicalPath = pagePath('/collections', page);
  const canonicalFullUrl = absoluteUrl(canonicalPath);
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    ...(page > 1
      ? [
          { name: 'Franchises', path: '/collections' },
          { name: `Page ${page}`, path: canonicalPath },
        ]
      : [{ name: 'Franchises', path: '/collections' }]),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalFullUrl}#webpage`,
        url: canonicalFullUrl,
        name: page > 1 ? `Movie Franchises & Watch Order Guides — Page ${page}` : 'Movie Franchises & Watch Order Guides',
        description: 'Complete movie franchise watch orders with chronological checklists and total marathon runtimes.',
        isPartOf: { '@id': websiteSchemaId() },
        publisher: { '@id': organizationSchemaId() },
        mainEntity: { '@id': `${canonicalFullUrl}#franchises` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalFullUrl}#breadcrumb`,
        itemListElement: breadcrumbItems.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.name,
          item: absoluteUrl(item.path),
        })),
      },
      {
        '@type': 'ItemList',
        '@id': `${canonicalFullUrl}#franchises`,
        name: 'Movie Franchises',
        numberOfItems: items.length,
        itemListElement: items.map((item, idx) => ({
          '@type': 'ListItem',
          position: (page - 1) * ITEMS_PER_PAGE + idx + 1,
          name: `${cleanFranchiseName(item.title)} Movies in Order`,
          url: absoluteUrl(`/collection/${item.slug}`),
        })),
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
        {breadcrumbItems.map((item, index) => (
          <span key={item.path} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {index === breadcrumbItems.length - 1 ? (
              <span aria-current="page" className="text-foreground">
                {item.name}
              </span>
            ) : (
              <Link href={item.path} prefetch={false} className="transition-colors hover:text-primary">
                {item.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <header className="mb-9 max-w-3xl sm:mb-11">
        <p className="eyebrow mb-3">Watch order guides</p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          Movie franchises in order
        </h1>
        <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg">
          Explore chronological release orders, marathon runtimes, official trailers, and streaming guides for major movie franchises.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{total.toLocaleString()}</span>{' '}
          {total === 1 ? 'franchise guide' : 'franchise guides'}
        </p>
      </header>

      {items.length > 0 ? (
        <>
          <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mb-12 lg:grid-cols-3">
            {items.map((item) => {
              const name = cleanFranchiseName(item.title);
              const art =
                item.coverImageUrl ||
                item.backdropUrl ||
                item.topMovieBackdropUrl ||
                item.posterUrl ||
                item.topMoviePosterUrl;
              const yearRange =
                item.earliestYear && item.latestYear
                  ? item.earliestYear === item.latestYear
                    ? String(item.earliestYear)
                    : `${item.earliestYear}–${item.latestYear}`
                  : null;
              const marathon =
                item.totalRuntimeMinutes > 0 ? formatMarathonRuntime(item.totalRuntimeMinutes) : null;

              return (
                <Link
                  key={item.id}
                  href={`/collection/${item.slug}`}
                  prefetch={false}
                  className="group overflow-hidden rounded-2xl border bg-card shadow-xs transition hover:border-primary/45 hover:shadow-md"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                    {art ? (
                      <Image
                        src={art}
                        alt={`${name} movies watch order`}
                        fill
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Layers className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 text-white">
                      <h2 className="line-clamp-2 text-lg font-semibold leading-tight tracking-[-0.02em]">
                        {name}
                      </h2>
                      <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                        {item.movieCount} films
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-xs text-muted-foreground">
                    {yearRange ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        {yearRange}
                      </span>
                    ) : null}
                    {marathon ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {marathon} marathon
                      </span>
                    ) : null}
                    <span className="ml-auto font-semibold text-primary group-hover:underline">
                      Watch order →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <Pagination currentPage={page} itemsPerPage={ITEMS_PER_PAGE} totalItems={total} />
        </>
      ) : (
        <div className="cinema-panel flex flex-col items-center justify-center rounded-2xl px-5 py-16 text-center">
          <Layers className="mb-4 h-10 w-10 text-muted-foreground/40" />
          <p className="text-lg font-semibold">No franchise guides are active yet</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Browse all published movies or popular rankings while franchise guides are being prepared.
          </p>
          <Link href="/movies" className="mt-5 text-sm font-semibold text-primary hover:underline">
            Browse all movies
          </Link>
        </div>
      )}
    </div>
  );
}
