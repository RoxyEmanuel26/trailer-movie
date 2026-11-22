import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, ChevronDown, Clock, Layers, Star } from 'lucide-react';
import { CollectionService } from '@/lib/services/CollectionService';
import { SeoService } from '@/lib/services/SeoService';
import { MovieService } from '@/lib/services/MovieService';
import { MovieCard } from '@/components/public/MovieCard';
import { Pagination } from '@/components/public/Pagination';
import { JsonLd } from '@/components/seo/JsonLd';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { NotFoundError } from '@/lib/errors';
import { absoluteUrl, organizationSchemaId, websiteSchemaId } from '@/lib/site-config';
import { moviePath } from '@/lib/public-routes';
import { buildFranchiseWatchGuide } from '@/lib/franchise-guides';
import { buildFaqJsonLd } from '@/lib/movie-aeo';

type SortMode = 'order' | 'latest' | 'top-rated';

function parseSortMode(raw: string | string[] | undefined): SortMode {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'latest' || value === 'top-rated') return value;
  return 'order';
}

function getCollectionOrderBy(sort: SortMode) {
  if (sort === 'latest') {
    return [
      { releaseDate: { sort: 'desc' as const, nulls: 'last' as const } },
      { popularity: 'desc' as const },
      { id: 'asc' as const },
    ];
  }
  if (sort === 'top-rated') {
    return [
      { voteAverage: { sort: 'desc' as const, nulls: 'last' as const } },
      { popularity: 'desc' as const },
      { id: 'asc' as const },
    ];
  }
  // Default: chronological release order for "movies in order" watch guides
  return [
    { releaseDate: { sort: 'asc' as const, nulls: 'last' as const } },
    { title: 'asc' as const },
    { id: 'asc' as const },
  ];
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  try {
    const collection = await CollectionService.getBySlug(slug);
    const page = parseStrictPage(query.page);
    if (!page) notFound();
    const { data: movies, total } = await MovieService.getPublicCatalogPage({
      page,
      itemsPerPage: 24,
      collectionSlug: collection.slug,
      orderBy: getCollectionOrderBy('order'),
    });
    if (isPageOutOfRange(page, total, 24)) notFound();
    const guide = buildFranchiseWatchGuide({
      title: collection.title,
      description: collection.description,
      movies,
      totalMovies: total,
      page,
    });
    const heroImage = collection.coverImageUrl || collection.backdropUrl || collection.posterUrl || undefined;
    return SeoService.generateMetadata('Collection', collection.id, {
      title: guide.metaTitle,
      description: guide.metaDescription,
      image: heroImage,
      path: pagePath(`/collection/${collection.slug}`, page),
      indexable: guide.indexable,
    });
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export const revalidate = 3600;

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  let collection;
  try {
    collection = await CollectionService.getBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const currentPage = parseStrictPage(query.page);
  if (!currentPage) notFound();
  const sortMode = parseSortMode(query.sort);
  const itemsPerPage = 24;

  const { data: movies, total: totalMovies } = await MovieService.getPublicCatalogPage({
    page: currentPage,
    itemsPerPage,
    collectionSlug: collection.slug,
    orderBy: getCollectionOrderBy(sortMode),
  });
  if (isPageOutOfRange(currentPage, totalMovies, itemsPerPage)) notFound();

  const guide = buildFranchiseWatchGuide({
    title: collection.title,
    description: collection.description,
    movies,
    totalMovies,
    page: currentPage,
  });

  const basePath = `/collection/${collection.slug}`;
  const canonicalPath = pagePath(basePath, currentPage);
  const canonicalFullUrl = absoluteUrl(canonicalPath);
  const heroImage = collection.coverImageUrl || collection.backdropUrl || movies[0]?.posterUrl || null;
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Franchises', path: '/collections' },
    ...(currentPage > 1
      ? [
          { name: guide.franchiseName, path: basePath },
          { name: `Page ${currentPage}`, path: canonicalPath },
        ]
      : [{ name: guide.franchiseName, path: basePath }]),
  ];
  const pageTitle = currentPage > 1 ? `${guide.heading} — Page ${currentPage}` : guide.heading;
  const listId = `${canonicalFullUrl}#movies`;
  const faqNode = currentPage === 1 && guide.faqs.length > 0 ? buildFaqJsonLd(canonicalFullUrl, guide.faqs) : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalFullUrl}#webpage`,
        url: canonicalFullUrl,
        name: pageTitle,
        description: guide.metaDescription,
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
        name: pageTitle,
        itemListOrder:
          sortMode === 'order'
            ? 'https://schema.org/ItemListOrderAscending'
            : 'https://schema.org/ItemListOrderDescending',
        numberOfItems: movies.length,
        itemListElement: movies.map((movie, index) => ({
          '@type': 'ListItem',
          position: (currentPage - 1) * itemsPerPage + index + 1,
          url: absoluteUrl(moviePath(movie.slug)),
          name: movie.title,
          ...(movie.posterUrl ? { image: movie.posterUrl } : {}),
        })),
      },
      ...(faqNode ? [faqNode] : []),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Hero Section */}
      <section className="relative flex min-h-[20rem] w-full flex-col justify-end overflow-hidden bg-[#0d0e0c] sm:min-h-[23rem] lg:min-h-[25rem]">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={`${guide.franchiseName} movies watch order`}
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e0c] via-[#0d0e0c]/65 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-[90rem] px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-white/70"
          >
            {breadcrumbItems.map((item, index) => (
              <span key={item.path} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {index === breadcrumbItems.length - 1 ? (
                  <span aria-current="page" className="text-white">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.path} prefetch={false} className="transition-colors hover:text-white">
                    {item.name}
                  </Link>
                )}
              </span>
            ))}
          </nav>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#f48a6f]">
            Franchise Watch Order &amp; Marathon Guide
          </p>
          <h1 className="mb-3 max-w-4xl break-words text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
            {guide.heading}
          </h1>
          <p className="line-clamp-4 max-w-3xl text-sm leading-6 text-white/80 drop-shadow sm:text-base sm:leading-7 lg:line-clamp-none lg:text-lg">
            {guide.intro}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5 text-xs font-semibold text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-primary-foreground shadow-sm">
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              {totalMovies} {totalMovies === 1 ? 'Movie' : 'Movies'}
            </span>
            {guide.marathonLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                <Clock className="h-3.5 w-3.5 text-[#f48a6f]" aria-hidden="true" />
                Total Marathon: {guide.marathonLabel}
              </span>
            ) : null}
            {guide.yearRange ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                <Calendar className="h-3.5 w-3.5 text-[#f48a6f]" aria-hidden="true" />
                {guide.yearRange}
              </span>
            ) : null}
            {guide.highestRatedMovie?.voteAverage ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" aria-hidden="true" />
                Top Rated: {guide.highestRatedMovie.title} ({guide.highestRatedMovie.voteAverage.toFixed(1)})
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Sort Controls */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <p className="text-sm text-muted-foreground">
            {sortMode === 'order'
              ? 'Ordered chronologically by release date (#1 to latest)'
              : sortMode === 'latest'
                ? 'Ordered from newest release to oldest'
                : 'Ordered by highest audience rating'}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <Link
              href={basePath}
              prefetch={false}
              className={`rounded-lg border px-3 py-2 transition ${sortMode === 'order' ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary/40'}`}
            >
              Watch Order (#1 → #{totalMovies})
            </Link>
            <Link
              href={`${basePath}?sort=latest`}
              prefetch={false}
              rel="nofollow"
              className={`rounded-lg border px-3 py-2 transition ${sortMode === 'latest' ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary/40'}`}
            >
              Newest First
            </Link>
            <Link
              href={`${basePath}?sort=top-rated`}
              prefetch={false}
              rel="nofollow"
              className={`rounded-lg border px-3 py-2 transition ${sortMode === 'top-rated' ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary/40'}`}
            >
              Highest Rated
            </Link>
          </div>
        </div>

        {movies.length > 0 ? (
          <>
            <div className="mb-10 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:mb-12 lg:grid-cols-6 lg:gap-y-8">
              {movies.map((movie, index) => {
                const position = (currentPage - 1) * itemsPerPage + index + 1;
                return (
                  <div key={movie.id} className="relative">
                    <span
                      className="pointer-events-none absolute left-2 top-2 z-20 inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-white/20 bg-black/80 px-2 text-xs font-bold tabular-nums text-white shadow-md backdrop-blur-sm"
                      aria-label={`Order number ${position}`}
                    >
                      #{position}
                    </span>
                    <MovieCard movie={movie} priority={index < 6} />
                  </div>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalMovies}
            />

            {/* Quick Chronological Checklist Table */}
            {currentPage === 1 && movies.length >= 2 ? (
              <section
                aria-labelledby="watch-order-table-heading"
                className="mt-12 overflow-hidden rounded-2xl border bg-card/55"
              >
                <div className="border-b px-5 py-4 sm:px-6">
                  <h2 id="watch-order-table-heading" className="text-lg font-semibold tracking-[-0.02em]">
                    {guide.franchiseName} Quick Marathon Checklist
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Release timeline, runtime, and audience score at a glance
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 font-semibold">#</th>
                        <th className="px-5 py-3 font-semibold">Movie</th>
                        <th className="px-5 py-3 font-semibold">Release</th>
                        <th className="px-5 py-3 font-semibold">Runtime</th>
                        <th className="px-5 py-3 font-semibold">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {movies.map((movie, idx) => {
                        const year = movie.releaseDate ? new Date(movie.releaseDate).getUTCFullYear() : null;
                        return (
                          <tr key={movie.id} className="transition-colors hover:bg-muted/30">
                            <td className="px-5 py-3 font-semibold tabular-nums text-muted-foreground">
                              {idx + 1}
                            </td>
                            <td className="px-5 py-3 font-medium">
                              <Link
                                href={moviePath(movie.slug)}
                                prefetch={false}
                                className="text-foreground transition-colors hover:text-primary hover:underline"
                              >
                                {movie.title}
                              </Link>
                            </td>
                            <td className="px-5 py-3 tabular-nums text-muted-foreground">{year ?? 'TBA'}</td>
                            <td className="px-5 py-3 tabular-nums text-muted-foreground">
                              {movie.runtimeMinutes ? `${movie.runtimeMinutes} min` : '—'}
                            </td>
                            <td className="px-5 py-3 tabular-nums">
                              {movie.voteAverage && movie.voteAverage > 0 ? `${movie.voteAverage.toFixed(1)}/10` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {/* FAQ Section */}
            {currentPage === 1 && guide.faqs.length > 0 ? (
              <section aria-labelledby="franchise-faq-heading" className="mt-10 max-w-4xl sm:mt-12">
                <h2 id="franchise-faq-heading" className="mb-4 text-xl font-semibold tracking-[-0.025em]">
                  Frequently asked questions
                </h2>
                <div className="divide-y overflow-hidden rounded-2xl border bg-card/50">
                  {guide.faqs.map((faq, index) => (
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg text-muted-foreground">No movies found in this franchise yet.</p>
          </div>
        )}
      </div>
    </>
  );
}
