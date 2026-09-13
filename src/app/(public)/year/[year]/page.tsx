import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';

interface PageProps {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year: rawYear } = await params;
  const year = Number(rawYear);
  const years = await MovieService.listPublishedReleaseYears();
  if (!Number.isInteger(year) || !years.includes(year)) notFound();
  return SeoService.generateMetadata('YearCatalog', rawYear, {
    title: `Movies released in ${year}`,
    description: `Browse movies and trailers released in ${year}.`,
    path: `/year/${year}`,
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

  const currentPage = parsePage(query.page);
  const itemsPerPage = 24;
  const { data: movies, total } = await MovieService.searchMovies({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    releaseYear: year,
    orderBy: [{ releaseDate: 'desc' }, { popularity: 'desc' }],
  });

  return (
    <CatalogPage
      eyebrow="Release year"
      title={`Movies released in ${year}`}
      description={`Explore trailers and movies released throughout ${year}, ordered by their release date.`}
      path={`/year/${year}`}
      movies={movies}
      totalMovies={total}
      currentPage={currentPage}
    />
  );
}

function parsePage(value: string | string[] | undefined) {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
