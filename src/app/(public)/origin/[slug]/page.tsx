import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { getOriginCatalogItem, ORIGIN_CATALOG } from '@/lib/public-catalog';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { catalogInsightFacts } from '@/lib/catalog-insights';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 3600;

export function generateStaticParams() {
  return ORIGIN_CATALOG.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const item = getOriginCatalogItem(slug);
  if (!item) notFound();
  const page = parseStrictPage(query.page);
  if (!page) notFound();
  const { total } = await MovieService.searchMovies({
    countryCodes: item.countryCodes,
    languageCodes: item.languageCodes,
    take: 1,
  });
  if (isPageOutOfRange(page, total, 24)) notFound();
  const description = `Browse published movies connected to ${item.label} by production country or spoken language, with trailers, cast, genres, ratings, and release details.`;
  return SeoService.generateMetadata('OriginCatalog', slug, {
    title: `${item.label} movies${page > 1 ? ` — Page ${page}` : ''}`,
    description,
    path: pagePath(`/origin/${item.slug}`, page),
    indexable: total >= 3,
  });
}

export default async function OriginPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const item = getOriginCatalogItem(slug);
  if (!item) notFound();

  const currentPage = parseStrictPage(query.page);
  if (!currentPage) notFound();
  const itemsPerPage = 24;
  const { data: movies, total } = await MovieService.searchMovies({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    countryCodes: item.countryCodes,
    languageCodes: item.languageCodes,
    orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }],
  });
  if (isPageOutOfRange(currentPage, total, itemsPerPage)) notFound();
  const stats = await MovieService.getCatalogStats({
    countryCodes: item.countryCodes,
    languageCodes: item.languageCodes,
  });
  const description = `Movies connected to ${item.label} through their production country or spoken language, sourced from the local catalog.`;

  return (
    <CatalogPage
      eyebrow="Country and language"
      title={`${item.label} movies`}
      description={description}
      path={`/origin/${item.slug}`}
      movies={movies}
      totalMovies={total}
      currentPage={currentPage}
      breadcrumbs={[{ name: 'Countries', path: '/countries' }]}
      facts={[
        { label: 'Matching rule', value: 'Production country or spoken language' },
        ...catalogInsightFacts(stats),
      ]}
    />
  );
}
