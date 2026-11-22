import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/public/CatalogPage';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { RUNTIME_GUIDES } from '@/lib/runtime-guides';
import { isPageOutOfRange, pagePath, parseStrictPage } from '@/lib/pagination';

interface Props {
  searchParams: Promise<{ page?: string | string[] }>;
}

export const revalidate = 3600;
const ITEMS_PER_PAGE = 24;
const GUIDE = RUNTIME_GUIDES['under-90-minutes'];

function getRuntimeMoviesPage(page: number) {
  return MovieService.getPublicCatalogPage({
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    minRuntimeMinutes: GUIDE.minRuntimeMinutes,
    maxRuntimeMinutes: GUIDE.maxRuntimeMinutes,
    orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }],
  });
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parseStrictPage((await searchParams).page);
  if (!page) notFound();
  const { total } = await getRuntimeMoviesPage(page);
  if (isPageOutOfRange(page, total, ITEMS_PER_PAGE)) notFound();
  return SeoService.generateMetadata('Page', `movies-${GUIDE.slug}`, {
    title: `${GUIDE.metaTitle}${page > 1 ? ` — Page ${page}` : ''}`,
    description: GUIDE.metaDescription,
    path: pagePath(GUIDE.path, page),
  });
}

export default async function MoviesUnder90MinutesPage({ searchParams }: Props) {
  const page = parseStrictPage((await searchParams).page);
  if (!page) notFound();
  const { data, total } = await getRuntimeMoviesPage(page);
  if (isPageOutOfRange(page, total, ITEMS_PER_PAGE)) notFound();

  const highlights = data.slice(0, 5).map((movie) => movie.title);

  return (
    <CatalogPage
      eyebrow={GUIDE.eyebrow}
      title={GUIDE.title}
      description={GUIDE.description}
      path={GUIDE.path}
      movies={data}
      totalMovies={total}
      currentPage={page}
      itemsPerPage={ITEMS_PER_PAGE}
      breadcrumbs={[{ name: 'Movies', path: '/movies' }]}
      facts={[
        { label: 'Runtime window', value: GUIDE.runtimeLabel },
        { label: 'Ranking', value: 'Audience popularity' },
        { label: 'Short films (<60m)', value: 'Excluded' },
      ]}
      relatedHeading="Explore more quick watch & movie guides"
      relatedLinks={GUIDE.relatedLinks}
      faqs={GUIDE.buildFaqs(total, highlights)}
    />
  );
}
