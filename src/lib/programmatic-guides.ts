import type { MovieFaqItem } from './movie-aeo';
import type { OriginCatalogItem } from './public-catalog';
import type { StreamingCatalogItem } from './streaming-catalog';

export const MIN_INDEXABLE_GUIDE_MOVIES = 10;
export const MIN_VISIBLE_GUIDE_MOVIES = 3;

export interface FacetGuideStats {
  total: number;
  earliestYear: number | null;
  latestYear: number | null;
  dominantGenres: Array<{ name: string; count: number }>;
  highlights: Array<{ title: string; slug: string; voteAverage: number | null }>;
}

export interface IndexableFacetGuides {
  streamingGenre: Array<{ streamingSlug: string; genreSlug: string; count: number }>;
  genreYear: Array<{ genreSlug: string; year: number; count: number }>;
  originGenre: Array<{ originSlug: string; genreSlug: string; count: number }>;
}

export interface RelatedGuideLink {
  href: string;
  label: string;
  count?: number;
}

const ORIGIN_ADJECTIVE_MAP: Record<string, string> = {
  'united-states-english': 'US & English',
  australia: 'Australian',
  'china-mandarin': 'Chinese',
  'france-french': 'French',
  'germany-german': 'German',
  'hong-kong-cantonese': 'Hong Kong',
  'indonesia-indonesian': 'Indonesian',
  'india-hindi': 'Indian',
  'united-kingdom': 'British',
  'italy-italian': 'Italian',
  'japan-japanese': 'Japanese',
  canada: 'Canadian',
  'south-korea-korean': 'Korean',
  'malaysia-malay': 'Malaysian',
  'mexico-spanish': 'Mexican & Spanish',
  'philippines-filipino': 'Filipino',
  'romania-romanian': 'Romanian',
  'russia-russian': 'Russian',
  taiwan: 'Taiwanese',
  'thailand-thai': 'Thai',
};

export function getOriginAdjective(origin: Pick<OriginCatalogItem, 'slug' | 'label'>): string {
  return ORIGIN_ADJECTIVE_MAP[origin.slug] || origin.label;
}

function formatHighlightTitles(stats: FacetGuideStats): string {
  const titles = stats.highlights
    .map((movie) => movie.title)
    .filter(Boolean)
    .slice(0, 3);
  if (titles.length === 0) return '';
  if (titles.length === 1) return titles[0];
  if (titles.length === 2) return `${titles[0]} and ${titles[1]}`;
  return `${titles[0]}, ${titles[1]}, and ${titles[2]}`;
}

function formatYearRange(stats: FacetGuideStats): string | null {
  if (!stats.earliestYear || !stats.latestYear) return null;
  return stats.earliestYear === stats.latestYear
    ? String(stats.latestYear)
    : `${stats.earliestYear}–${stats.latestYear}`;
}

export function buildStreamingGenreGuide(
  streaming: StreamingCatalogItem,
  genre: { name: string; slug: string },
  stats: FacetGuideStats,
  total: number,
  page = 1,
) {
  const countText = total.toLocaleString('en-US');
  const highlights = formatHighlightTitles(stats);
  const yearRange = formatYearRange(stats);

  const metaTitle = `Best ${genre.name} Movies on ${streaming.label}${page > 1 ? ` — Page ${page}` : ''}`;
  const heading = `${genre.name} movies on ${streaming.label}`;
  const metaDescription = highlights
    ? `Browse ${countText} ${genre.name.toLowerCase()} movies on ${streaming.label}, including ${highlights}. Watch official trailers, explore cast, ratings, and availability.`
    : `Browse ${countText} ${genre.name.toLowerCase()} movies available on ${streaming.label}, complete with official trailers, cast profiles, ratings, and release guides.`;
  const intro =
    `Explore ${countText} published ${genre.name.toLowerCase()} films listed on ${streaming.label}` +
    `${yearRange ? ` spanning ${yearRange}` : ''}` +
    `${highlights ? `, featuring audience favorites such as ${highlights}` : ''}. ` +
    `Regional catalogs vary by territory—open any title for its official trailer, cast list, and country-specific viewing options.`;

  const faqs: MovieFaqItem[] = [
    {
      question: `How many ${genre.name.toLowerCase()} movies are on ${streaming.label}?`,
      answer: `MovieFlix currently indexes ${countText} published ${genre.name.toLowerCase()} movies with regional availability on ${streaming.label} (${streaming.accessLabel.toLowerCase()}). Lineups differ by country, so check each movie page for availability in your territory.`,
    },
  ];
  if (highlights) {
    faqs.push({
      question: `What are the most popular ${genre.name.toLowerCase()} movies on ${streaming.label}?`,
      answer: `Top popular ${genre.name.toLowerCase()} titles listed on ${streaming.label} include ${highlights}. Open any film card above to watch its official trailer, review audience scores, and verify streaming options.`,
    });
  }
  faqs.push({
    question: `How does MovieFlix organize ${genre.name.toLowerCase()} titles on ${streaming.label}?`,
    answer: `This guide ranks published ${genre.name.toLowerCase()} titles connected to ${streaming.label} by audience popularity and release recency. Every movie includes a verified trailer, synopsis, runtime, cast and crew credits, and JustWatch-attributed viewing data.`,
  });

  return {
    metaTitle,
    heading,
    metaDescription,
    intro,
    faqs,
    indexable: total >= MIN_INDEXABLE_GUIDE_MOVIES,
  };
}

export function buildGenreYearGuide(
  genre: { name: string; slug: string },
  year: number,
  stats: FacetGuideStats,
  total: number,
  page = 1,
) {
  const countText = total.toLocaleString('en-US');
  const highlights = formatHighlightTitles(stats);
  const currentYear = new Date().getUTCFullYear();
  const eraWord = year > currentYear ? 'Upcoming' : year === currentYear ? 'New' : 'Best';

  const metaTitle = `${eraWord} ${genre.name} Movies of ${year}${page > 1 ? ` — Page ${page}` : ''}`;
  const heading = `${genre.name} movies of ${year}`;
  const metaDescription = highlights
    ? `Explore ${countText} ${genre.name.toLowerCase()} movies from ${year}, including ${highlights}. Watch official trailers, compare ratings, cast, and where to stream.`
    : `Browse ${countText} ${genre.name.toLowerCase()} movies released in ${year} on MovieFlix with official trailers, cast credits, audience ratings, and streaming guides.`;
  const intro =
    `Discover ${countText} published ${genre.name.toLowerCase()} films released in ${year}` +
    `${highlights ? `, led by ${highlights}` : ''}. ` +
    `Compare official trailers, runtimes, directors, lead cast members, audience ratings, and current streaming or digital rental options.`;

  const faqs: MovieFaqItem[] = [
    {
      question: `How many ${genre.name.toLowerCase()} movies were released in ${year}?`,
      answer: `MovieFlix currently catalogs ${countText} quality-verified ${genre.name.toLowerCase()} films from ${year}, ordered by audience popularity and release date.`,
    },
  ];
  if (highlights) {
    faqs.push({
      question: `What are the top ${genre.name.toLowerCase()} movies of ${year}?`,
      answer: `Notable ${year} ${genre.name.toLowerCase()} releases in the MovieFlix catalog include ${highlights}. Select any movie to watch its official trailer and inspect regional streaming availability.`,
    });
  }
  faqs.push({
    question: `Where can I watch ${year} ${genre.name.toLowerCase()} movies online?`,
    answer: `Each ${year} ${genre.name.toLowerCase()} movie page on MovieFlix displays regional subscription streaming, digital rental, and purchase providers alongside its official trailer.`,
  });

  return {
    metaTitle,
    heading,
    metaDescription,
    intro,
    faqs,
    indexable: total >= MIN_INDEXABLE_GUIDE_MOVIES,
  };
}

export function buildOriginGenreGuide(
  origin: OriginCatalogItem,
  genre: { name: string; slug: string },
  stats: FacetGuideStats,
  total: number,
  page = 1,
) {
  const adjective = getOriginAdjective(origin);
  const countText = total.toLocaleString('en-US');
  const highlights = formatHighlightTitles(stats);
  const yearRange = formatYearRange(stats);

  const metaTitle = `Best ${adjective} ${genre.name} Movies${page > 1 ? ` — Page ${page}` : ''}`;
  const heading = `${adjective} ${genre.name.toLowerCase()} movies`;
  const metaDescription = highlights
    ? `Discover ${countText} ${adjective} ${genre.name.toLowerCase()} movies, including ${highlights}. Watch official trailers, check cast, ratings, and streaming platforms.`
    : `Browse ${countText} ${adjective} ${genre.name.toLowerCase()} movies on MovieFlix with official trailers, cast filmographies, ratings, and viewing options.`;
  const intro =
    `Explore ${countText} published ${genre.name.toLowerCase()} movies connected to ${origin.label} by production country or spoken language` +
    `${yearRange ? ` (${yearRange})` : ''}` +
    `${highlights ? `, highlighted by ${highlights}` : ''}. ` +
    `Watch official trailers, read full story synopses, and compare regional streaming availability.`;

  const faqs: MovieFaqItem[] = [
    {
      question: `How many ${adjective} ${genre.name.toLowerCase()} movies are on MovieFlix?`,
      answer: `MovieFlix lists ${countText} published ${genre.name.toLowerCase()} titles connected to ${origin.label} through production origin or spoken dialogue.`,
    },
  ];
  if (highlights) {
    faqs.push({
      question: `Which ${adjective} ${genre.name.toLowerCase()} movies are most popular?`,
      answer: `Popular ${adjective} ${genre.name.toLowerCase()} films in our catalog include ${highlights}. Click any title to watch its official trailer and explore cast credits and viewing platforms.`,
    });
  }

  return {
    metaTitle,
    heading,
    metaDescription,
    intro,
    faqs,
    indexable: total >= MIN_INDEXABLE_GUIDE_MOVIES,
  };
}

export function getRelatedGuidesForStreaming(
  streaming: StreamingCatalogItem,
  guides: IndexableFacetGuides,
  genreMap: Map<string, { name: string; slug: string }>,
  limit = 12,
): RelatedGuideLink[] {
  return guides.streamingGenre
    .filter((entry) => entry.streamingSlug === streaming.slug && genreMap.has(entry.genreSlug))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => {
      const genre = genreMap.get(entry.genreSlug)!;
      return {
        href: `/streaming/${streaming.slug}/${genre.slug}`,
        label: `${genre.name} on ${streaming.label}`,
        count: entry.count,
      };
    });
}

export function getRelatedGuidesForGenre(
  genre: { name: string; slug: string },
  guides: IndexableFacetGuides,
  streamingMap: Map<string, StreamingCatalogItem>,
  originMap: Map<string, OriginCatalogItem>,
): RelatedGuideLink[] {
  const years = guides.genreYear
    .filter((entry) => entry.genreSlug === genre.slug)
    .sort((a, b) => b.year - a.year)
    .slice(0, 6)
    .map((entry) => ({
      href: `/genre/${genre.slug}/${entry.year}`,
      label: `${entry.year} ${genre.name} movies`,
      count: entry.count,
    }));

  const streaming = guides.streamingGenre
    .filter((entry) => entry.genreSlug === genre.slug && streamingMap.has(entry.streamingSlug))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((entry) => {
      const platform = streamingMap.get(entry.streamingSlug)!;
      return {
        href: `/streaming/${platform.slug}/${genre.slug}`,
        label: `${genre.name} on ${platform.label}`,
        count: entry.count,
      };
    });

  const origins = guides.originGenre
    .filter((entry) => entry.genreSlug === genre.slug && originMap.has(entry.originSlug))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((entry) => {
      const origin = originMap.get(entry.originSlug)!;
      return {
        href: `/origin/${origin.slug}/${genre.slug}`,
        label: `${getOriginAdjective(origin)} ${genre.name}`,
        count: entry.count,
      };
    });

  return [...years, ...streaming, ...origins];
}

export function getRelatedGuidesForYear(
  year: number,
  guides: IndexableFacetGuides,
  genreMap: Map<string, { name: string; slug: string }>,
  limit = 12,
): RelatedGuideLink[] {
  return guides.genreYear
    .filter((entry) => entry.year === year && genreMap.has(entry.genreSlug))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => {
      const genre = genreMap.get(entry.genreSlug)!;
      return {
        href: `/genre/${genre.slug}/${year}`,
        label: `${year} ${genre.name} movies`,
        count: entry.count,
      };
    });
}

export function getRelatedGuidesForOrigin(
  origin: OriginCatalogItem,
  guides: IndexableFacetGuides,
  genreMap: Map<string, { name: string; slug: string }>,
  limit = 12,
): RelatedGuideLink[] {
  const adjective = getOriginAdjective(origin);
  return guides.originGenre
    .filter((entry) => entry.originSlug === origin.slug && genreMap.has(entry.genreSlug))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => {
      const genre = genreMap.get(entry.genreSlug)!;
      return {
        href: `/origin/${origin.slug}/${genre.slug}`,
        label: `${adjective} ${genre.name}`,
        count: entry.count,
      };
    });
}
