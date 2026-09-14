import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { getPopularCatalogItem, POPULAR_CATALOG } from '@/lib/public-catalog';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { catalogInsightFacts } from '@/lib/catalog-insights';

interface PageProps {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 3600;

export function generateStaticParams() {
  return POPULAR_CATALOG.map(({ slug }) => ({ mode: slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ mode }, query] = await Promise.all([params, searchParams]);
  const item = getPopularCatalogItem(mode);
  if (!item) notFound();
  const page = parseStrictPage(query.page);
  if (!page) notFound();
  const { total } = item.slug === 'top-rated'
    ? await MovieService.searchTopRatedMovies({ take: 1 })
    : await MovieService.searchMovies({ take: 1, ...(item.slug === 'latest-releases' ? { releaseDateLte: new Date() } : {}) });
  if (isPageOutOfRange(page, total, 24)) notFound();
  return SeoService.generateMetadata('PopularCatalog', mode, {
    title: `${item.label} movies${page > 1 ? ` — Page ${page}` : ''}`,
    description: item.description,
    path: pagePath(`/popular/${item.slug}`, page),
  });
}

export default async function PopularPage({ params, searchParams }: PageProps) {
  const [{ mode }, query] = await Promise.all([params, searchParams]);
  const item = getPopularCatalogItem(mode);
  if (!item) notFound();

  const currentPage = parseStrictPage(query.page);
  if (!currentPage) notFound();
  const itemsPerPage = 24;
  const paging = { skip: (currentPage - 1) * itemsPerPage, take: itemsPerPage };
  const { data: movies, total } =
    item.slug === 'top-rated'
      ? await MovieService.searchTopRatedMovies(paging)
      : await MovieService.searchMovies({
          ...paging,
          orderBy: item.orderBy,
          ...(item.slug === 'latest-releases' ? { releaseDateLte: new Date() } : {}),
        });
  if (isPageOutOfRange(currentPage, total, itemsPerPage)) notFound();
  const stats = await MovieService.getCatalogStats({
    ...(item.slug === 'latest-releases' ? { releaseDateLte: new Date() } : {}),
    ...(item.slug === 'top-rated' ? { minimumVotes: 50 } : {}),
  });
  const insightFacts = catalogInsightFacts(
    stats,
    item.slug === 'top-rated' ? movies.slice(0, 3).map((movie) => movie.title) : undefined
  );

  return (
    <CatalogPage
      eyebrow="Popular collections"
      title={`${item.label} movies`}
      description={item.description}
      path={`/popular/${item.slug}`}
      movies={movies}
      totalMovies={total}
      currentPage={currentPage}
      breadcrumbs={[{ name: 'Popular', path: '/popular' }]}
      facts={[
        ...(item.slug === 'top-rated' ? [{ label: 'Eligibility', value: '50+ audience votes' }, { label: 'Ranking', value: 'Bayesian weighted score' }] : []),
        ...insightFacts,
      ]}
    />
  );
}
