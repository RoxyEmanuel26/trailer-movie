import type { Prisma } from '@prisma/client';

export type PopularMode = 'most-popular' | 'top-rated' | 'latest-releases' | 'recently-added';

export interface PopularCatalogItem {
  slug: PopularMode;
  label: string;
  description: string;
  orderBy?: Prisma.MovieOrderByWithRelationInput | Prisma.MovieOrderByWithRelationInput[];
}

export interface OriginCatalogItem {
  slug: string;
  label: string;
  countryCodes: string[];
  languageCodes: string[];
}

export const POPULAR_CATALOG: PopularCatalogItem[] = [
  {
    slug: 'most-popular',
    label: 'Most popular',
    description: 'Discover the movies drawing the most audience interest across MovieFlix, ordered by locally stored TMDB popularity and vote activity.',
    orderBy: [{ popularity: 'desc' }, { voteCount: 'desc' }],
  },
  {
    slug: 'top-rated',
    label: 'Top rated',
    description: 'Compare highly rated movies with at least 50 audience votes, ranked with a Bayesian weighted score that reduces small-sample bias.',
  },
  {
    slug: 'latest-releases',
    label: 'Latest releases',
    description: 'Browse movies that have already reached their release date, ordered from the newest release backward without mixing in upcoming titles.',
    orderBy: [{ releaseDate: 'desc' }, { popularity: 'desc' }],
  },
  {
    slug: 'recently-added',
    label: 'Recently added',
    description: 'Explore the movies most recently added to the local MovieFlix catalog, independent of when each title originally reached theaters.',
    orderBy: [{ createdAt: 'desc' }, { popularity: 'desc' }],
  },
];

export const ORIGIN_CATALOG: OriginCatalogItem[] = [
  {
    slug: 'united-states-english',
    label: 'United States / English',
    countryCodes: ['US'],
    languageCodes: ['en'],
  },
  { slug: 'australia', label: 'Australia', countryCodes: ['AU'], languageCodes: [] },
  {
    slug: 'china-mandarin',
    label: 'China / Mandarin',
    countryCodes: ['CN'],
    languageCodes: ['zh'],
  },
  { slug: 'france-french', label: 'France / French', countryCodes: ['FR'], languageCodes: ['fr'] },
  {
    slug: 'germany-german',
    label: 'Germany / German',
    countryCodes: ['DE'],
    languageCodes: ['de'],
  },
  {
    slug: 'hong-kong-cantonese',
    label: 'Hong Kong / Cantonese',
    countryCodes: ['HK'],
    languageCodes: ['cn'],
  },
  {
    slug: 'indonesia-indonesian',
    label: 'Indonesia / Indonesian',
    countryCodes: ['ID'],
    languageCodes: ['id'],
  },
  { slug: 'india-hindi', label: 'India / Hindi', countryCodes: ['IN'], languageCodes: ['hi'] },
  { slug: 'united-kingdom', label: 'United Kingdom', countryCodes: ['GB'], languageCodes: [] },
  { slug: 'italy-italian', label: 'Italy / Italian', countryCodes: ['IT'], languageCodes: ['it'] },
  {
    slug: 'japan-japanese',
    label: 'Japan / Japanese',
    countryCodes: ['JP'],
    languageCodes: ['ja'],
  },
  { slug: 'canada', label: 'Canada', countryCodes: ['CA'], languageCodes: [] },
  {
    slug: 'south-korea-korean',
    label: 'South Korea / Korean',
    countryCodes: ['KR'],
    languageCodes: ['ko'],
  },
  {
    slug: 'malaysia-malay',
    label: 'Malaysia / Malay',
    countryCodes: ['MY'],
    languageCodes: ['ms'],
  },
  {
    slug: 'mexico-spanish',
    label: 'Mexico / Spanish',
    countryCodes: ['MX'],
    languageCodes: ['es'],
  },
  {
    slug: 'philippines-filipino',
    label: 'Philippines / Filipino',
    countryCodes: ['PH'],
    languageCodes: ['tl'],
  },
  {
    slug: 'romania-romanian',
    label: 'Romania / Romanian',
    countryCodes: ['RO'],
    languageCodes: ['ro'],
  },
  {
    slug: 'russia-russian',
    label: 'Russia / Russian',
    countryCodes: ['RU'],
    languageCodes: ['ru'],
  },
  { slug: 'taiwan', label: 'Taiwan', countryCodes: ['TW'], languageCodes: [] },
  { slug: 'thailand-thai', label: 'Thailand / Thai', countryCodes: ['TH'], languageCodes: ['th'] },
];

export function getPopularCatalogItem(slug: string) {
  return POPULAR_CATALOG.find((item) => item.slug === slug);
}

export function getOriginCatalogItem(slug: string) {
  return ORIGIN_CATALOG.find((item) => item.slug === slug);
}
