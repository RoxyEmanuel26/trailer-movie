import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { catalogInsightFacts } from '@/lib/catalog-insights';

interface PageProps {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ year: rawYear }, query] = await Promise.all([params, searchParams]);
  const year = Number(rawYear);
  const years = await MovieService.listPublishedReleaseYears();
  if (!Number.isInteger(year) || !years.includes(year)) notFound();
  const page = parseStrictPage(query.page);
  if (!page) notFound();
  const { total } = await MovieService.searchMovies({ releaseYear: year, take: 1 });
  if (isPageOutOfRange(page, total, 24)) notFound();
  return SeoService.generateMetadata('YearCatalog', rawYear, {
    title: `Movies released in ${year}${page > 1 ? ` — Page ${page}` : ''}`,
    description: `Browse published movies and trailers released in ${year}, then explore their cast, genres, ratings, production origins, and viewing information.`,
    path: pagePath(`/year/${year}`, page),
    indexable: total >= 3,
  });
}

export default async function YearPage({ params, searchParams }: PageProps) {
  const [{ year: rawYear }, query, years] = await Promise.all([
    params,
    searchParams,
    MovieService.listPublishedReleaseYears(),
  ]);
  const year = Number(rawYear);
  if (!Number.isInteger(year) || !years.includes(year)) notFound();

  const currentPage = parseStrictPage(query.page);
  if (!currentPage) notFound();
  const itemsPerPage = 24;
  const { data: movies, total } = await MovieService.searchMovies({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    releaseYear: year,
    orderBy: [{ releaseDate: 'desc' }, { popularity: 'desc' }],
  });
  if (isPageOutOfRange(currentPage, total, itemsPerPage)) notFound();
  const stats = await MovieService.getCatalogStats({ releaseYear: year });

  return (
    <CatalogPage
      eyebrow="Release year"
      title={`Movies released in ${year}`}
      description={`Explore trailers and movies released throughout ${year}, ordered by their release date.`}
      path={`/year/${year}`}
      movies={movies}
      totalMovies={total}
      currentPage={currentPage}
      breadcrumbs={[{ name: 'Years', path: '/years' }]}
      facts={[
        { label: 'Release year', value: String(year) },
        ...catalogInsightFacts(stats),
      ]}
    />
  );
}
