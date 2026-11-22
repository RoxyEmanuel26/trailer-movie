import type { ComponentProps } from 'react';
import Link from 'next/link';
import { ChevronDown, Compass, Film } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { Pagination } from './Pagination';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl, organizationSchemaId, websiteSchemaId } from '@/lib/site-config';
import { moviePath } from '@/lib/public-routes';
import { pagePath } from '@/lib/pagination';
import { buildFaqJsonLd, type MovieFaqItem } from '@/lib/movie-aeo';
import type { RelatedGuideLink } from '@/lib/programmatic-guides';

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
  facts?: Array<{ label: string; value: string }>;
  relatedHeading?: string;
  relatedLinks?: RelatedGuideLink[];
  faqs?: MovieFaqItem[];
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
  facts = [],
  relatedHeading = 'Explore related guides',
  relatedLinks = [],
  faqs = [],
}: CatalogPageProps) {
  const canonicalPath = pagePath(path, currentPage);
  const canonicalFullUrl = absoluteUrl(canonicalPath);
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    ...breadcrumbs,
    ...(currentPage > 1
      ? [
          { name: title, path },
          { name: `Page ${currentPage}`, path: canonicalPath },
        ]
      : [{ name: title, path }]),
  ];
  const pageTitle = currentPage > 1 ? `${title} — Page ${currentPage}` : title;
  const listId = `${canonicalFullUrl}#movies`;
  const faqNode = currentPage === 1 && faqs.length > 0 ? buildFaqJsonLd(canonicalFullUrl, faqs) : null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalFullUrl}#webpage`,
        url: canonicalFullUrl,
        name: pageTitle,
        description,
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
        {facts.length ? (
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t pt-5 text-sm">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-muted-foreground">{fact.label}</dt>
                <dd className="mt-0.5 font-semibold text-foreground">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </header>

      {movies.length ? (
        <>
          <div className="mb-10 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:mb-12 lg:grid-cols-6 lg:gap-y-8">
            {movies.map((movie, index) => (
              <MovieCard key={movie.id} movie={movie} priority={index < 6} />
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
          <Link href="/movies" className="mt-6 text-sm font-semibold text-primary hover:underline">
            Browse all movies
          </Link>
        </div>
      )}

      {relatedLinks.length > 0 ? (
        <section
          aria-labelledby="related-guides-heading"
          className="mt-12 rounded-2xl border bg-card/55 p-5 sm:mt-14 sm:p-7"
        >
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Compass className="h-4 w-4" aria-hidden="true" />
            <h2 id="related-guides-heading">{relatedHeading}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border bg-background/80 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <span>{link.label}</span>
                {typeof link.count === 'number' ? (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {link.count.toLocaleString()}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {currentPage === 1 && faqs.length > 0 ? (
        <section
          aria-labelledby="catalog-faq-heading"
          className="mt-10 max-w-4xl sm:mt-12"
        >
          <h2 id="catalog-faq-heading" className="mb-4 text-xl font-semibold tracking-[-0.025em]">
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
