import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { GenreService } from '@/lib/services/GenreService';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { catalogInsightFacts } from '@/lib/catalog-insights';
import { NotFoundError } from '@/lib/errors';
import {
  buildGenreYearGuide,
  getRelatedGuidesForYear,
  MIN_VISIBLE_GUIDE_MOVIES,
} from '@/lib/programmatic-guides';

interface PageProps {
  params: Promise<{ slug: string; year: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug, year: rawYear }, query, years] = await Promise.all([
    params,
    searchParams,
    MovieService.listPublishedReleaseYears(),
  ]);
  const year = Number(rawYear);
  if (!/^\d{4}$/.test(rawYear) || !Number.isInteger(year) || !years.includes(year)) notFound();

  let genre;
  try {
    genre = await GenreService.getBySlug(slug);
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
      genreSlug: genre.slug,
      releaseYear: year,
      orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }],
    }),
    MovieService.getCatalogStats({
      genreSlug: genre.slug,
      releaseYear: year,
    }),
  ]);
  if (total < MIN_VISIBLE_GUIDE_MOVIES || isPageOutOfRange(page, total, 24)) notFound();

  const guide = buildGenreYearGuide(genre, year, stats, total, page);
  return SeoService.generateMetadata('GenreYearGuide', `${genre.slug}/${year}`, {
    title: guide.metaTitle,
    description: guide.metaDescription,
    path: pagePath(`/genre/${genre.slug}/${year}`, page),
    indexable: guide.indexable && Boolean(genre.description?.trim()),
  });
}

export default async function GenreYearPage({ params, searchParams }: PageProps) {
  const [{ slug, year: rawYear }, query, years] = await Promise.all([
    params,
    searchParams,
    MovieService.listPublishedReleaseYears(),
  ]);
  const year = Number(rawYear);
  if (!/^\d{4}$/.test(rawYear) || !Number.isInteger(year) || !years.includes(year)) notFound();

  let genre;
  try {
    genre = await GenreService.getBySlug(slug);
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
      genreSlug: genre.slug,
      releaseYear: year,
      orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }],
    }),
    MovieService.getCatalogStats({
      genreSlug: genre.slug,
      releaseYear: year,
    }),
    GenreService.listGenres(),
    MovieService.getIndexableFacetGuides().catch(() => null),
  ]);
  if (total < MIN_VISIBLE_GUIDE_MOVIES || isPageOutOfRange(currentPage, total, itemsPerPage)) {
    notFound();
  }

  const guide = buildGenreYearGuide(genre, year, stats, total, currentPage);
  const genreMap = new Map(allGenres.map((item) => [item.slug, item]));
  const otherYears = facetGuides
    ? facetGuides.genreYear
        .filter((entry) => entry.genreSlug === genre.slug && entry.year !== year)
        .sort((a, b) => b.year - a.year)
        .slice(0, 6)
        .map((entry) => ({
          href: `/genre/${genre.slug}/${entry.year}`,
          label: `${entry.year} ${genre.name} movies`,
          count: entry.count,
        }))
    : [];
  const otherGenresSameYear = facetGuides
    ? getRelatedGuidesForYear(year, facetGuides, genreMap, 8).filter(
        (link) => link.href !== `/genre/${genre.slug}/${year}`,
      )
    : [];
  const relatedLinks = [
    { href: `/genre/${genre.slug}`, label: `All ${genre.name} movies` },
    { href: `/year/${year}`, label: `All ${year} movies` },
    ...otherYears,
    ...otherGenresSameYear,
  ];

  return (
    <CatalogPage
      eyebrow={`${year} · ${genre.name} archive`}
      title={guide.heading}
      description={guide.intro}
      path={`/genre/${genre.slug}/${year}`}
      movies={movies}
      totalMovies={total}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      breadcrumbs={[
        { name: 'Genres', path: '/genres' },
        { name: `${genre.name} movies`, path: `/genre/${genre.slug}` },
      ]}
      facts={[
        { label: 'Release year', value: String(year) },
        ...catalogInsightFacts(stats),
      ]}
      relatedHeading={`More ${genre.name.toLowerCase()} years & ${year} genres`}
      relatedLinks={relatedLinks}
      faqs={guide.faqs}
    />
  );
}
