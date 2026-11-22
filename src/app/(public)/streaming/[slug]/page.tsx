import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { GenreService } from '@/lib/services/GenreService';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { getStreamingCatalogItem, STREAMING_CATALOG } from '@/lib/streaming-catalog';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { catalogInsightFacts } from '@/lib/catalog-insights';
import { getRelatedGuidesForStreaming } from '@/lib/programmatic-guides';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 3600;

export function generateStaticParams() {
  return STREAMING_CATALOG.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const item = getStreamingCatalogItem(slug);
  if (!item) notFound();
  const page = parseStrictPage(query.page);
  if (!page) notFound();

  const { total } = await MovieService.getPublicCatalogPage({
    page,
    itemsPerPage: 24,
    providerTmdbIds: item.tmdbIds,
    orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }],
  });
  if (isPageOutOfRange(page, total, 24)) notFound();

  return SeoService.generateMetadata('StreamingCatalog', slug, {
    title: `Best Movies on ${item.label} — Trailers & Guide`,
    description: item.description,
    path: pagePath(`/streaming/${item.slug}`, page),
    indexable: total >= 3,
  });
}

export default async function StreamingPlatformPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const item = getStreamingCatalogItem(slug);
  if (!item) notFound();

  const currentPage = parseStrictPage(query.page);
  if (!currentPage) notFound();

  const itemsPerPage = 24;
  const [{ data: movies, total }, stats, genres, facetGuides] = await Promise.all([
    MovieService.getPublicCatalogPage({
      page: currentPage,
      itemsPerPage,
      providerTmdbIds: item.tmdbIds,
      orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }],
    }),
    MovieService.getCatalogStats({
      providerTmdbIds: item.tmdbIds,
    }),
    GenreService.listGenres(),
    MovieService.getIndexableFacetGuides().catch(() => null),
  ]);
  if (isPageOutOfRange(currentPage, total, itemsPerPage)) notFound();

  const genreMap = new Map(genres.map((genre) => [genre.slug, genre]));
  const relatedLinks = facetGuides
    ? getRelatedGuidesForStreaming(item, facetGuides, genreMap)
    : [];

  return (
    <CatalogPage
      eyebrow="Streaming & digital catalog"
      title={`Movies on ${item.label}`}
      description={item.description}
      path={`/streaming/${item.slug}`}
      movies={movies}
      totalMovies={total}
      currentPage={currentPage}
      breadcrumbs={[{ name: 'Streaming', path: '/streaming' }]}
      facts={[
        { label: 'Access model', value: item.accessLabel },
        ...catalogInsightFacts(stats),
      ]}
      relatedHeading={`Browse ${item.label} by genre`}
      relatedLinks={relatedLinks}
    />
  );
}
