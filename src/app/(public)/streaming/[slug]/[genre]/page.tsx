import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { GenreService } from '@/lib/services/GenreService';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { getStreamingCatalogItem } from '@/lib/streaming-catalog';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { catalogInsightFacts } from '@/lib/catalog-insights';
import { NotFoundError } from '@/lib/errors';
import {
  buildStreamingGenreGuide,
  getRelatedGuidesForStreaming,
  MIN_VISIBLE_GUIDE_MOVIES,
} from '@/lib/programmatic-guides';

interface PageProps {
  params: Promise<{ slug: string; genre: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug, genre: genreSlug }, query] = await Promise.all([params, searchParams]);
  const streaming = getStreamingCatalogItem(slug);
  if (!streaming) notFound();

  let genre;
  try {
    genre = await GenreService.getBySlug(genreSlug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const page = parseStrictPage(query.page);
  if (!page) notFound();

  const [{ total }, stats] = await Promise.all([
    MovieService.getPublicCatalogPage({
      page,
      itemsPerPage: 24,
      providerTmdbIds: streaming.tmdbIds,
      genreSlug: genre.slug,
      orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }],
    }),
    MovieService.getCatalogStats({
      providerTmdbIds: streaming.tmdbIds,
      genreSlug: genre.slug,
    }),
  ]);
  if (total < MIN_VISIBLE_GUIDE_MOVIES || isPageOutOfRange(page, total, 24)) notFound();

  const guide = buildStreamingGenreGuide(streaming, genre, stats, total, page);
  return SeoService.generateMetadata('StreamingGenreGuide', `${streaming.slug}/${genre.slug}`, {
    title: guide.metaTitle,
    description: guide.metaDescription,
    path: pagePath(`/streaming/${streaming.slug}/${genre.slug}`, page),
    indexable: guide.indexable && Boolean(genre.description?.trim()),
  });
}

export default async function StreamingGenrePage({ params, searchParams }: PageProps) {
  const [{ slug, genre: genreSlug }, query] = await Promise.all([params, searchParams]);
  const streaming = getStreamingCatalogItem(slug);
  if (!streaming) notFound();

  let genre;
  try {
    genre = await GenreService.getBySlug(genreSlug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const currentPage = parseStrictPage(query.page);
  if (!currentPage) notFound();

  const itemsPerPage = 24;
  const [{ data: movies, total }, stats, allGenres, facetGuides] = await Promise.all([
    MovieService.getPublicCatalogPage({
      page: currentPage,
      itemsPerPage,
      providerTmdbIds: streaming.tmdbIds,
      genreSlug: genre.slug,
      orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }],
    }),
    MovieService.getCatalogStats({
      providerTmdbIds: streaming.tmdbIds,
      genreSlug: genre.slug,
    }),
    GenreService.listGenres(),
    MovieService.getIndexableFacetGuides().catch(() => null),
  ]);
  if (total < MIN_VISIBLE_GUIDE_MOVIES || isPageOutOfRange(currentPage, total, itemsPerPage)) {
    notFound();
  }

  const guide = buildStreamingGenreGuide(streaming, genre, stats, total, currentPage);
  const genreMap = new Map(allGenres.map((item) => [item.slug, item]));
  const siblingLinks = facetGuides
    ? getRelatedGuidesForStreaming(streaming, facetGuides, genreMap, 10).filter(
        (link) => link.href !== `/streaming/${streaming.slug}/${genre.slug}`,
      )
    : [];
  const relatedLinks = [
    { href: `/streaming/${streaming.slug}`, label: `All ${streaming.label} movies` },
    { href: `/genre/${genre.slug}`, label: `All ${genre.name} movies` },
    ...siblingLinks,
  ];

  return (
    <CatalogPage
      eyebrow={`${streaming.label} · ${genre.name} guide`}
      title={guide.heading}
      description={guide.intro}
      path={`/streaming/${streaming.slug}/${genre.slug}`}
      movies={movies}
      totalMovies={total}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      breadcrumbs={[
        { name: 'Streaming', path: '/streaming' },
        { name: streaming.label, path: `/streaming/${streaming.slug}` },
      ]}
      facts={[
        { label: 'Access model', value: streaming.accessLabel },
        ...catalogInsightFacts(stats),
      ]}
      relatedHeading={`More genres on ${streaming.label}`}
      relatedLinks={relatedLinks}
      faqs={guide.faqs}
    />
  );
}
