import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, ChevronDown, Clock, Film, Play, Sparkles, Star } from 'lucide-react';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { JsonLd } from '@/components/seo/JsonLd';
import { moviePath } from '@/lib/public-routes';
import { absoluteUrl, organizationSchemaId, websiteSchemaId } from '@/lib/site-config';
import { buildFaqJsonLd } from '@/lib/movie-aeo';
import {
  analyzeMovieSimilarity,
  buildMoviesLikeGuideContent,
  isEligibleForMoviesLikeIndex,
} from '@/lib/movies-like';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

function toSimilaritySource(
  movie: NonNullable<Awaited<ReturnType<typeof MovieService.getSimilarMoviesGuide>>>['guide']['movie'],
) {
  return {
    id: movie.id,
    title: movie.title,
    slug: movie.slug,
    releaseDate: movie.releaseDate,
    runtimeMinutes: movie.runtimeMinutes,
    voteAverage: movie.voteAverage,
    voteCount: movie.voteCount,
    importQualityStatus: movie.importQualityStatus,
    genres: movie.genres,
    keywords: movie.keywords,
    directors: movie.people.map((p) => p.person.name),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await MovieService.getSimilarMoviesGuide(slug);
  if (!result || result.guide.recommendations.length === 0) notFound();
  if (result.shouldRedirect) permanentRedirect(result.canonicalPath);

  const { movie, recommendations } = result.guide;
  const source = toSimilaritySource(movie);
  const analyzed = recommendations.map((rec) =>
    analyzeMovieSimilarity(source, {
      ...rec,
      directors: rec.people.map((p) => p.person.name),
    }),
  );
  const content = buildMoviesLikeGuideContent(source, analyzed);
  const indexable = isEligibleForMoviesLikeIndex({
    importQualityStatus: movie.importQualityStatus,
    voteCount: movie.voteCount,
    recommendationCount: recommendations.length,
  });

  return SeoService.generateMetadata('MoviesLikeGuide', movie.id, {
    title: content.metaTitle,
    description: content.metaDescription,
    image: `${result.canonicalPath}/opengraph-image`,
    path: result.canonicalPath,
    indexable,
  });
}

export default async function MoviesLikePage({ params }: PageProps) {
  const { slug } = await params;
  const result = await MovieService.getSimilarMoviesGuide(slug);
  if (!result || result.guide.recommendations.length === 0) notFound();
  if (result.shouldRedirect) permanentRedirect(result.canonicalPath);

  const { movie, recommendations } = result.guide;
  const source = toSimilaritySource(movie);
  const analyzed = recommendations.map((rec) =>
    analyzeMovieSimilarity(source, {
      ...rec,
      directors: rec.people.map((p) => p.person.name),
    }),
  );
  const content = buildMoviesLikeGuideContent(source, analyzed);

  const canonicalFullUrl = absoluteUrl(result.canonicalPath);
  const sourceWatchPath = moviePath(movie.slug);
  const primaryGenre = movie.genres[0]?.genre || null;
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Movies', path: '/movies' },
    ...(primaryGenre ? [{ name: primaryGenre.name, path: `/genre/${primaryGenre.slug}` }] : []),
    { name: movie.title, path: sourceWatchPath },
    { name: `Movies Like ${movie.title}`, path: result.canonicalPath },
  ];

  const listId = `${canonicalFullUrl}#recommendations`;
  const faqNode = content.faqs.length > 0 ? buildFaqJsonLd(canonicalFullUrl, content.faqs) : null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalFullUrl}#webpage`,
        url: canonicalFullUrl,
        name: content.heading,
        description: content.metaDescription,
        dateModified: movie.updatedAt.toISOString(),
        isPartOf: { '@id': websiteSchemaId() },
        publisher: { '@id': organizationSchemaId() },
        mainEntity: { '@id': listId },
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
        '@id': listId,
        name: `Best Movies Like ${content.titleWithYear}`,
        numberOfItems: analyzed.length,
        itemListElement: analyzed.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.movie.title,
          url: absoluteUrl(moviePath(item.movie.slug)),
          ...(item.movie.posterUrl ? { image: item.movie.posterUrl } : {}),
        })),
      },
      ...(faqNode ? [faqNode] : []),
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <JsonLd data={jsonLd} />

      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground sm:mb-8"
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

      {/* Source Movie Hero Banner */}
      <header className="cinema-panel mb-10 overflow-hidden rounded-3xl p-5 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <Link
            href={sourceWatchPath}
            prefetch={false}
            className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-2xl border bg-muted shadow-lg sm:w-36"
          >
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={`${content.titleWithYear} poster`}
                fill
                priority
                sizes="144px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Film className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-2 inline-flex items-center gap-1.5 text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Curated Recommendation Guide
            </p>
            <h1 className="text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
              {content.heading}{' '}
              {content.sourceYear ? (
                <span className="font-normal text-muted-foreground">({content.sourceYear})</span>
              ) : null}
            </h1>
            <p className="mt-3 max-w-[68ch] text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              {content.intro}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link
                href={sourceWatchPath}
                prefetch={false}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition hover:opacity-90"
              >
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span>Watch {movie.title} Trailer</span>
              </Link>
              <Link
                href={sourceWatchPath}
                prefetch={false}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border bg-background px-3.5 py-2 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Full cast &amp; reviews</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Ranked Similar Movies Grid with Information Gain */}
      <section aria-labelledby="similar-picks-heading" className="mb-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="similar-picks-heading" className="text-2xl font-semibold tracking-[-0.03em]">
              Top {analyzed.length} Picks Similar to {movie.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Compared by shared themes, genres, runtime, ratings, and streaming availability
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {analyzed.map((item, idx) => {
            const watchHref = moviePath(item.movie.slug);
            return (
              <article
                key={item.movie.id}
                className="group flex gap-4 rounded-2xl border bg-card/70 p-4 transition hover:border-primary/45 hover:bg-card"
              >
                <Link
                  href={watchHref}
                  prefetch={false}
                  className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-xl border bg-muted sm:w-28"
                >
                  <span className="absolute left-1.5 top-1.5 z-10 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">
                    #{idx + 1}
                  </span>
                  {item.movie.posterUrl ? (
                    <Image
                      src={item.movie.posterUrl}
                      alt={`${item.movie.title} poster`}
                      fill
                      priority={idx < 4}
                      sizes="112px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Film className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold leading-snug tracking-[-0.02em] sm:text-lg">
                      <Link href={watchHref} prefetch={false} className="hover:text-primary hover:underline">
                        {item.movie.title}
                      </Link>
                      {item.year ? (
                        <span className="ml-1.5 text-sm font-normal text-muted-foreground">({item.year})</span>
                      ) : null}
                    </h3>
                    {item.movie.voteAverage && item.movie.voteAverage > 0 ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-muted/60 px-2 py-0.5 text-xs font-semibold tabular-nums">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" aria-hidden="true" />
                        {item.movie.voteAverage.toFixed(1)}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1.5 text-xs font-medium text-primary">{item.reasonText}</p>

                  {item.movie.synopsis ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                      {item.movie.synopsis}
                    </p>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-[11px] text-muted-foreground">
                    {item.movie.runtimeMinutes ? (
                      <span className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {item.movie.runtimeMinutes}m
                        {item.runtimeComparison ? ` (${item.runtimeComparison})` : ''}
                      </span>
                    ) : null}
                    {item.providerNames.slice(0, 2).map((provider) => (
                      <span
                        key={provider}
                        className="rounded-md border bg-background px-2 py-0.5 font-medium text-foreground"
                      >
                        {provider}
                      </span>
                    ))}
                    <Link
                      href={watchHref}
                      prefetch={false}
                      className="ml-auto font-semibold text-primary hover:underline"
                    >
                      Trailer →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Quick Comparison Table */}
      <section
        aria-labelledby="comparison-table-heading"
        className="mb-12 overflow-hidden rounded-2xl border bg-card/55"
      >
        <div className="border-b px-5 py-4 sm:px-6">
          <h2 id="comparison-table-heading" className="text-lg font-semibold tracking-[-0.02em]">
            Side-by-Side Comparison: Movies Like {movie.title}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">#</th>
                <th className="px-5 py-3 font-semibold">Movie</th>
                <th className="px-5 py-3 font-semibold">Year</th>
                <th className="px-5 py-3 font-semibold">Rating</th>
                <th className="px-5 py-3 font-semibold">Runtime</th>
                <th className="px-5 py-3 font-semibold">Why It Matches</th>
                <th className="px-5 py-3 font-semibold">Streaming</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {analyzed.map((item, idx) => (
                <tr key={item.movie.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-5 py-3 font-semibold tabular-nums text-muted-foreground">{idx + 1}</td>
                  <td className="px-5 py-3 font-medium">
                    <Link
                      href={moviePath(item.movie.slug)}
                      prefetch={false}
                      className="text-foreground hover:text-primary hover:underline"
                    >
                      {item.movie.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">{item.year ?? '—'}</td>
                  <td className="px-5 py-3 tabular-nums">
                    {item.movie.voteAverage && item.movie.voteAverage > 0 ? `${item.movie.voteAverage.toFixed(1)}/10` : '—'}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">
                    {item.movie.runtimeMinutes ? `${item.movie.runtimeMinutes} min` : '—'}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{item.reasonText}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {item.providerNames.length > 0 ? item.providerNames.slice(0, 3).join(', ') : 'Check page'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      {content.faqs.length > 0 ? (
        <section aria-labelledby="movies-like-faq-heading" className="max-w-4xl">
          <h2 id="movies-like-faq-heading" className="mb-4 text-xl font-semibold tracking-[-0.025em]">
            Frequently asked questions
          </h2>
          <div className="divide-y overflow-hidden rounded-2xl border bg-card/50">
            {content.faqs.map((faq, index) => (
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
