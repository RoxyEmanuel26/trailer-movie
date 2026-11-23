import type { Prisma } from '@prisma/client';

export type PopularMode = 'most-popular' | 'top-rated' | 'latest-releases';

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
    description: 'Explore the movies attracting the strongest audience interest across MovieFlix, with widely discovered favorites brought to the front.',
    // Matches partial index `movies_public_popularity_desc_idx` (0.5ms index scan vs 9.6s with NULLS LAST)
    orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }],
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
    // Matches partial index `movies_public_release_desc_idx` with `releaseDate IS NOT NULL AND releaseDate <= NOW()` (0.13ms index-only scan)
    orderBy: [{ releaseDate: 'desc' }, { popularity: 'desc' }, { id: 'asc' }],
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
  { slug: 'ireland', label: 'Ireland', countryCodes: ['IE'], languageCodes: [] },
  { slug: 'spain-spanish', label: 'Spain / Spanish', countryCodes: ['ES'], languageCodes: [] },
  { slug: 'italy-italian', label: 'Italy / Italian', countryCodes: ['IT'], languageCodes: ['it'] },
  { slug: 'nordic', label: 'Nordic (Sweden, Norway & Denmark)', countryCodes: ['SE', 'NO', 'DK'], languageCodes: ['sv', 'no', 'da'] },
  { slug: 'belgium', label: 'Belgium', countryCodes: ['BE'], languageCodes: [] },
  { slug: 'netherlands-dutch', label: 'Netherlands / Dutch', countryCodes: ['NL'], languageCodes: ['nl'] },
  { slug: 'poland-polish', label: 'Poland / Polish', countryCodes: ['PL'], languageCodes: ['pl'] },
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
