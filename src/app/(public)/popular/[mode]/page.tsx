import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { getPopularCatalogItem, POPULAR_CATALOG } from '@/lib/public-catalog';

interface PageProps {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 3600;

export function generateStaticParams() {
  return POPULAR_CATALOG.map(({ slug }) => ({ mode: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mode } = await params;
  const item = getPopularCatalogItem(mode);
  if (!item) notFound();
  return SeoService.generateMetadata('PopularCatalog', mode, {
    title: `${item.label} movies`,
    description: item.description,
    path: `/popular/${item.slug}`,
  });
}

export default async function PopularPage({ params, searchParams }: PageProps) {
  const [{ mode }, query] = await Promise.all([params, searchParams]);
  const item = getPopularCatalogItem(mode);
  if (!item) notFound();

  const currentPage = parsePage(query.page);
  const itemsPerPage = 24;
  const { data: movies, total } = await MovieService.searchMovies({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    orderBy: item.orderBy,
  });

  return (
    <CatalogPage
      eyebrow="Popular collections"
      title={`${item.label} movies`}
      description={item.description}
      path={`/popular/${item.slug}`}
      movies={movies}
      totalMovies={total}
      currentPage={currentPage}
      breadcrumbs={[{ name: 'Popular', path: '/popular/most-popular' }]}
    />
  );
}

function parsePage(value: string | string[] | undefined) {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
