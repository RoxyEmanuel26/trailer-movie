import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import {
  buildStudioFaqs,
  getStudioBySlug,
  STUDIO_CATALOG,
} from '@/lib/studio-catalog';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { catalogInsightFacts } from '@/lib/catalog-insights';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 3600;
const ITEMS_PER_PAGE = 24;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const studio = getStudioBySlug(slug);
  if (!studio) notFound();

  const page = parseStrictPage(query.page);
  if (!page) notFound();

  const { total } = await MovieService.getPublicCatalogPage({
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    companyTmdbIds: studio.tmdbIds,
    orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }],
  });
  if (isPageOutOfRange(page, total, ITEMS_PER_PAGE)) notFound();

  return SeoService.generateMetadata('StudioCatalog', studio.slug, {
    title: `Best ${studio.name} Movies — Official Trailers, Cast & Where to Watch${page > 1 ? ` — Page ${page}` : ''}`,
    description: studio.description,
    path: pagePath(`/studio/${studio.slug}`, page),
    indexable: total >= 3,
  });
}

export default async function StudioDetailPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const studio = getStudioBySlug(slug);
  if (!studio) notFound();

  const currentPage = parseStrictPage(query.page);
  if (!currentPage) notFound();

  const [{ data: movies, total }, stats, studioCounts] = await Promise.all([
    MovieService.getPublicCatalogPage({
      page: currentPage,
      itemsPerPage: ITEMS_PER_PAGE,
      companyTmdbIds: studio.tmdbIds,
      orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }],
    }),
    MovieService.getCatalogStats({ companyTmdbIds: studio.tmdbIds }),
    MovieService.countStudioGroups(STUDIO_CATALOG),
  ]);
  if (isPageOutOfRange(currentPage, total, ITEMS_PER_PAGE)) notFound();

  const highlights = stats.highlights.length
    ? stats.highlights.map((h) => h.title)
    : movies.slice(0, 4).map((m) => m.title);

  const peerStudios = STUDIO_CATALOG.filter(
    (s) => s.slug !== studio.slug && s.region === studio.region && (studioCounts.get(s.slug) || 0) >= 3,
  )
    .slice(0, 8)
    .map((s) => ({
      href: `/studio/${s.slug}`,
      label: `${s.name} movies`,
      count: studioCounts.get(s.slug) || 0,
    }));

  return (
    <CatalogPage
      eyebrow={`Film studio · ${studio.countryLabel}`}
      title={`${studio.name} Movies`}
      description={studio.description}
      path={`/studio/${studio.slug}`}
      movies={movies}
      totalMovies={total}
      currentPage={currentPage}
      itemsPerPage={ITEMS_PER_PAGE}
      breadcrumbs={[{ name: 'Film Studios', path: '/studios' }]}
      facts={[
        { label: 'Headquarters / Market', value: studio.countryLabel },
        { label: 'Ranking', value: 'Global popularity' },
        ...catalogInsightFacts(stats),
      ]}
      relatedHeading="Explore more film studios"
      relatedLinks={[
        { href: '/studios', label: 'All film studios' },
        ...peerStudios,
        { href: '/themes', label: 'Browse by movie theme' },
        { href: '/tonight', label: 'Movie Night Picker' },
      ]}
      faqs={buildStudioFaqs({ studio, total, highlights })}
    />
  );
}
