import type { Metadata } from 'next';
import { CatalogHub } from '@/components/public/CatalogHub';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';

export const revalidate = 3600;

function describeReleaseYear(year: number, count: number, currentYear: number): string {
  const formattedCount = count.toLocaleString();
  if (year > currentYear) {
    return `Preview ${formattedCount} upcoming ${year} theatrical and streaming titles with official trailers, early cast lineups, and release schedules.`;
  }
  if (year === currentYear) {
    return `Watch official trailers for ${formattedCount} new ${year} movie releases, complete with cast credits, ratings, and where-to-watch availability.`;
  }
  if (year === currentYear - 1) {
    return `Catch up on ${formattedCount} recent ${year} films across action, drama, horror, animation, and international cinema with verified streaming links.`;
  }
  if (year >= 2020) {
    return `Browse ${formattedCount} feature films from ${year}—compare audience scores, directors, lead actors, and current streaming or digital rental options.`;
  }
  return `Explore ${formattedCount} notable ${year} releases in the MovieFlix archive with theatrical trailers, full cast lists, and genre classifications.`;
}

export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'years', {
    title: 'Movies by Release Year — Official Trailers & Streaming Guide',
    description:
      'Browse published movies and official trailers by release year on MovieFlix. Compare cast, genres, ratings, and where to stream or rent titles from every cinema era.',
    path: '/years',
  });
}

export default async function YearsPage() {
  const allYears = await MovieService.listPublishedReleaseYearStats();
  const indexableYears = allYears.filter((item) => Number(item.count) >= 3);
  const years = indexableYears.length > 0 ? indexableYears : allYears;
  const currentYear = new Date().getUTCFullYear();
  const totalMovies = years.reduce((sum, item) => sum + Number(item.count), 0);
  const newestYear = years[0]?.year;
  const oldestYear = years[years.length - 1]?.year;

  const items = years.map((item) => {
    const count = Number(item.count);
    return {
      href: `/year/${item.year}`,
      title: `${item.year} Movies`,
      description: describeReleaseYear(item.year, count, currentYear),
      count,
    };
  });

  const hubDescription =
    newestYear && oldestYear
      ? `Navigate ${totalMovies.toLocaleString()} published films and trailers across ${years.length} release years (${oldestYear}–${newestYear}), organized chronologically with verified cast and streaming metadata.`
      : 'Move through the MovieFlix timeline and discover published films grouped by their original release year.';

  return (
    <CatalogHub
      eyebrow="Browse the timeline"
      title="Movies by release year"
      description={hubDescription}
      path="/years"
      items={items}
    />
  );
}
