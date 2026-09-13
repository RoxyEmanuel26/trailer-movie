import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { getOriginCatalogItem, ORIGIN_CATALOG } from '@/lib/public-catalog';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 3600;

export function generateStaticParams() {
  return ORIGIN_CATALOG.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getOriginCatalogItem(slug);
  if (!item) notFound();
  const description = `Browse movies connected to ${item.label} by production country or spoken language.`;
  return SeoService.generateMetadata('OriginCatalog', slug, {
    title: `${item.label} movies`,
    description,
    path: `/origin/${item.slug}`,
  });
}

export default async function OriginPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const item = getOriginCatalogItem(slug);
  if (!item) notFound();

  const currentPage = parsePage(query.page);
  const itemsPerPage = 24;
  const { data: movies, total } = await MovieService.searchMovies({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    countryCodes: item.countryCodes,
    languageCodes: item.languageCodes,
    orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }],
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
    />
  );
}

function parsePage(value: string | string[] | undefined) {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
