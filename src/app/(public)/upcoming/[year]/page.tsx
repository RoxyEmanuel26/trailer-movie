import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';
import { catalogInsightFacts } from '@/lib/catalog-insights';
import { buildUpcomingHubFaqs } from '@/lib/upcoming-guides';

interface PageProps {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 1800;
const ITEMS_PER_PAGE = 24;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ year: rawYear }, query, upcomingYears] = await Promise.all([
    params,
    searchParams,
    MovieService.listUpcomingReleaseYears(),
  ]);
  const year = Number(rawYear);
  if (
    !/^\d{4}$/.test(rawYear) ||
    !Number.isInteger(year) ||
    !upcomingYears.some((entry) => entry.year === year)
  ) {
    notFound();
  }

  const page = parseStrictPage(query.page);
  if (!page) notFound();

  const { total } = await MovieService.getPublicCatalogPage({
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    releaseYear: year,
    upcomingOnly: true,
    orderBy: [{ releaseDate: 'asc' }, { popularity: 'desc' }, { id: 'asc' }],
  });
  if (isPageOutOfRange(page, total, ITEMS_PER_PAGE)) notFound();

  return SeoService.generateMetadata('UpcomingCatalog', rawYear, {
    title: `Upcoming ${year} Movies & Official Trailers — Release Schedule${page > 1 ? ` — Page ${page}` : ''}`,
    description: `Watch official trailers for ${total.toLocaleString('en-US')} scheduled upcoming ${year} movies across the US, Europe, and Asia, complete with release dates, synopses, and cast lists.`,
    path: pagePath(`/upcoming/${year}`, page),
    indexable: total >= 3,
  });
}

export default async function UpcomingYearPage({ params, searchParams }: PageProps) {
  const [{ year: rawYear }, query, upcomingYears] = await Promise.all([
    params,
    searchParams,
    MovieService.listUpcomingReleaseYears(),
  ]);
  const year = Number(rawYear);
  if (
    !/^\d{4}$/.test(rawYear) ||
    !Number.isInteger(year) ||
    !upcomingYears.some((entry) => entry.year === year)
  ) {
    notFound();
  }

  const currentPage = parseStrictPage(query.page);
  if (!currentPage) notFound();

  const [{ data: movies, total }, stats] = await Promise.all([
    MovieService.getPublicCatalogPage({
      page: currentPage,
      itemsPerPage: ITEMS_PER_PAGE,
      releaseYear: year,
      upcomingOnly: true,
      orderBy: [{ releaseDate: 'asc' }, { popularity: 'desc' }, { id: 'asc' }],
    }),
    MovieService.getCatalogStats({ releaseYear: year, upcomingOnly: true }),
  ]);

  if (isPageOutOfRange(currentPage, total, ITEMS_PER_PAGE)) notFound();

  const highlights = stats.highlights.length
    ? stats.highlights.map((h) => h.title)
    : movies.slice(0, 4).map((m) => m.title);

  const relatedLinks = [
    { href: '/upcoming', label: 'All Upcoming Movies' },
    ...upcomingYears
      .filter((entry) => entry.year !== year)
      .map((entry) => ({
        href: `/upcoming/${entry.year}`,
        label: `Upcoming ${entry.year} Movies`,
        count: entry.count,
      })),
    { href: `/year/${year}`, label: `Complete ${year} Catalog` },
    { href: '/tonight', label: 'Movie Night Picker' },
    { href: '/watchlist', label: 'My Watchlist' },
  ];

  return (
    <CatalogPage
      eyebrow="Upcoming release calendar"
      title={`Upcoming ${year} Movies & Official Trailers`}
      description={`Track ${total.toLocaleString('en-US')} upcoming ${year} theatrical releases with verified official YouTube trailers, release dates, synopses, and cast lists across the US, Europe, and Asia.`}
      path={`/upcoming/${year}`}
      movies={movies}
      totalMovies={total}
      currentPage={currentPage}
      itemsPerPage={ITEMS_PER_PAGE}
      breadcrumbs={[{ name: 'Upcoming Movies', path: '/upcoming' }]}
      facts={[
        { label: 'Release year', value: String(year) },
        ...catalogInsightFacts(stats),
      ]}
      relatedHeading="Explore upcoming & release guides"
      relatedLinks={relatedLinks}
      faqs={buildUpcomingHubFaqs({ total, year, highlights })}
    />
  );
}
