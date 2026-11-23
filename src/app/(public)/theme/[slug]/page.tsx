import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import {
  buildThemeFaqs,
  getThemeBySlug,
  THEME_CATALOG,
  THEME_CATEGORY_LABELS,
} from '@/lib/theme-catalog';
import { MIN_INDEXABLE_GUIDE_MOVIES } from '@/lib/programmatic-guides';
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
  const theme = getThemeBySlug(slug);
  if (!theme) notFound();

  const page = parseStrictPage(query.page);
  if (!page) notFound();

  const { total } = await MovieService.getPublicCatalogPage({
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    keywordTmdbIds: theme.keywordTmdbIds,
    orderBy: [{ popularity: 'desc' }, { voteAverage: 'desc' }, { id: 'asc' }],
  });
  if (isPageOutOfRange(page, total, ITEMS_PER_PAGE)) notFound();

  return SeoService.generateMetadata('ThemeCatalog', theme.slug, {
    title: `${theme.title} — Official Trailers & Streaming Guide${page > 1 ? ` — Page ${page}` : ''}`,
    description: theme.description,
    path: pagePath(`/theme/${theme.slug}`, page),
    indexable: total >= MIN_INDEXABLE_GUIDE_MOVIES,
  });
}

export default async function ThemeDetailPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const theme = getThemeBySlug(slug);
  if (!theme) notFound();

  const currentPage = parseStrictPage(query.page);
  if (!currentPage) notFound();

  const [{ data: movies, total }, stats, themeCounts] = await Promise.all([
    MovieService.getPublicCatalogPage({
      page: currentPage,
      itemsPerPage: ITEMS_PER_PAGE,
      keywordTmdbIds: theme.keywordTmdbIds,
      orderBy: [{ popularity: 'desc' }, { voteAverage: 'desc' }, { id: 'asc' }],
    }),
    MovieService.getCatalogStats({ keywordTmdbIds: theme.keywordTmdbIds }),
    MovieService.countThemeGroups(THEME_CATALOG),
  ]);
  if (isPageOutOfRange(currentPage, total, ITEMS_PER_PAGE)) notFound();

  const highlights = stats.highlights.length
    ? stats.highlights.map((h) => h.title)
    : movies.slice(0, 4).map((m) => m.title);

  const peerThemes = THEME_CATALOG.filter(
    (t) =>
      t.slug !== theme.slug &&
      t.category === theme.category &&
      (themeCounts.get(t.slug) || 0) >= MIN_INDEXABLE_GUIDE_MOVIES,
  )
    .slice(0, 8)
    .map((t) => ({
      href: `/theme/${t.slug}`,
      label: t.label,
      count: themeCounts.get(t.slug) || 0,
    }));

  return (
    <CatalogPage
      eyebrow={THEME_CATEGORY_LABELS[theme.category]}
      title={theme.title}
      description={theme.description}
      path={`/theme/${theme.slug}`}
      movies={movies}
      totalMovies={total}
      currentPage={currentPage}
      itemsPerPage={ITEMS_PER_PAGE}
      breadcrumbs={[{ name: 'Movie Themes', path: '/themes' }]}
      facts={[
        { label: 'Theme', value: theme.label },
        { label: 'Ranking', value: 'Global popularity' },
        ...catalogInsightFacts(stats),
      ]}
      relatedHeading="Explore related themes & guides"
      relatedLinks={[
        { href: '/themes', label: 'All movie themes' },
        ...peerThemes,
        { href: '/studios', label: 'Browse by film studio' },
        { href: '/tonight', label: 'Movie Night Picker' },
      ]}
      faqs={buildThemeFaqs({ theme, total, highlights })}
    />
  );
}
