import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { GenreService } from '@/lib/services/GenreService';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { getOriginCatalogItem } from '@/lib/public-catalog';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { catalogInsightFacts } from '@/lib/catalog-insights';
import { NotFoundError } from '@/lib/errors';
import {
  buildOriginGenreGuide,
  getOriginAdjective,
  getRelatedGuidesForOrigin,
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
  const origin = getOriginCatalogItem(slug);
  if (!origin) notFound();

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
      countryCodes: origin.countryCodes,
      languageCodes: origin.languageCodes,
      genreSlug: genre.slug,
      orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }],
    }),
    MovieService.getCatalogStats({
      countryCodes: origin.countryCodes,
      languageCodes: origin.languageCodes,
      genreSlug: genre.slug,
    }),
  ]);
  if (total < MIN_VISIBLE_GUIDE_MOVIES || isPageOutOfRange(page, total, 24)) notFound();

  const guide = buildOriginGenreGuide(origin, genre, stats, total, page);
  return SeoService.generateMetadata('OriginGenreGuide', `${origin.slug}/${genre.slug}`, {
    title: guide.metaTitle,
    description: guide.metaDescription,
    path: pagePath(`/origin/${origin.slug}/${genre.slug}`, page),
    indexable: guide.indexable && Boolean(genre.description?.trim()),
  });
}

export default async function OriginGenrePage({ params, searchParams }: PageProps) {
  const [{ slug, genre: genreSlug }, query] = await Promise.all([params, searchParams]);
  const origin = getOriginCatalogItem(slug);
  if (!origin) notFound();

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
      countryCodes: origin.countryCodes,
      languageCodes: origin.languageCodes,
      genreSlug: genre.slug,
      orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }],
    }),
    MovieService.getCatalogStats({
      countryCodes: origin.countryCodes,
      languageCodes: origin.languageCodes,
      genreSlug: genre.slug,
    }),
    GenreService.listGenres(),
    MovieService.getIndexableFacetGuides().catch(() => null),
  ]);
  if (total < MIN_VISIBLE_GUIDE_MOVIES || isPageOutOfRange(currentPage, total, itemsPerPage)) {
    notFound();
  }

  const guide = buildOriginGenreGuide(origin, genre, stats, total, currentPage);
  const genreMap = new Map(allGenres.map((item) => [item.slug, item]));
  const siblingLinks = facetGuides
    ? getRelatedGuidesForOrigin(origin, facetGuides, genreMap, 10).filter(
        (link) => link.href !== `/origin/${origin.slug}/${genre.slug}`,
      )
    : [];
  const relatedLinks = [
    { href: `/origin/${origin.slug}`, label: `All ${origin.label} movies` },
    { href: `/genre/${genre.slug}`, label: `All ${genre.name} movies` },
    ...siblingLinks,
  ];

  return (
    <CatalogPage
      eyebrow={`${origin.label} · ${genre.name}`}
      title={guide.heading}
      description={guide.intro}
      path={`/origin/${origin.slug}/${genre.slug}`}
      movies={movies}
      totalMovies={total}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      breadcrumbs={[
        { name: 'Countries', path: '/countries' },
        { name: origin.label, path: `/origin/${origin.slug}` },
      ]}
      facts={[
        { label: 'Origin rule', value: `${origin.label} country or spoken language` },
        ...catalogInsightFacts(stats),
      ]}
      relatedHeading={`More ${getOriginAdjective(origin)} movie genres`}
      relatedLinks={relatedLinks}
      faqs={guide.faqs}
    />
  );
}
