import type { MovieFaqItem } from './movie-aeo';

export type StudioRegion = 'us' | 'europe' | 'asia';

export interface StudioCatalogItem {
  slug: string;
  name: string;
  region: StudioRegion;
  countryLabel: string;
  tmdbIds: number[];
  tagline: string;
  description: string;
}

export const STUDIO_REGION_LABELS: Record<StudioRegion, { label: string; subtitle: string }> = {
  us: {
    label: 'US & Hollywood Studios',
    subtitle: 'Iconic American majors, indie tastemakers, animation leaders, and genre powerhouses.',
  },
  europe: {
    label: 'European Cinema Studios',
    subtitle: 'Flagship British, French, Italian, German, and Nordic film studios and prestige backers.',
  },
  asia: {
    label: 'Asian Cinema & Anime Studios',
    subtitle: 'Legendary Japanese theatrical & anime houses, Korean cinema leaders, and Bollywood powerhouses.',
  },
};

export const STUDIO_CATALOG: StudioCatalogItem[] = [
  // US & Hollywood
  {
    slug: 'a24',
    name: 'A24',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [41077],
    tagline: 'Boundary-pushing indie cinema, elevated horror, and Oscar-winning dramas.',
    description:
      'Explore A24 movies ranked by audience popularity, featuring official trailers, cast credits, runtimes, and streaming availability across elevated horror, sci-fi, and modern indie classics.',
  },
  {
    slug: 'blumhouse',
    name: 'Blumhouse Productions',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [3172],
    tagline: 'Modern horror hits, psychological thrillers, and genre-defining franchises.',
    description:
      'Browse Blumhouse Productions horror and thriller movies with official trailers, ratings, casts, and where to watch across global streaming services.',
  },
  {
    slug: 'marvel-studios',
    name: 'Marvel Studios',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [420],
    tagline: 'Blockbuster superhero epics spanning the Marvel Cinematic Universe.',
    description:
      'Discover Marvel Studios films with official trailers, release dates, runtimes, cast guides, and streaming availability.',
  },
  {
    slug: 'pixar',
    name: 'Pixar',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [3],
    tagline: 'Beloved computer-animated classics and modern family adventures.',
    description:
      'Explore Pixar Animation Studios movies complete with official trailers, release years, runtimes, voice casts, and streaming platforms.',
  },
  {
    slug: 'warner-bros',
    name: 'Warner Bros. Pictures',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [174],
    tagline: 'Iconic Hollywood tentpoles, auteur sci-fi, and prestige dramas.',
    description:
      'Watch trailers and browse movies produced by Warner Bros. Pictures, complete with cast credits, ratings, and regional streaming options.',
  },
  {
    slug: 'universal-pictures',
    name: 'Universal Pictures',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [33],
    tagline: 'Global theatrical blockbusters, thrillers, action franchises, and comedy hits.',
    description:
      'Discover Universal Pictures releases with verified official trailers, audience scores, runtimes, and where to stream or rent.',
  },
  {
    slug: 'lionsgate',
    name: 'Lionsgate',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [1632],
    tagline: 'High-octane action sagas, sharp thrillers, and standout genre releases.',
    description:
      'Browse Lionsgate movies ranked by popularity with official trailers, synopses, cast filmographies, and streaming availability.',
  },
  {
    slug: 'paramount-pictures',
    name: 'Paramount Pictures',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [4],
    tagline: 'Big-screen action spectacles, acclaimed dramas, and sci-fi favorites.',
    description:
      'Explore Paramount Pictures releases with trailers, ratings, directors, casts, and streaming platform guides.',
  },
  {
    slug: 'amazon-mgm-studios',
    name: 'Amazon MGM Studios',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [210099, 21],
    tagline: 'Theatrical releases and Prime Video originals from MGM & Amazon.',
    description:
      'Discover Amazon MGM Studios and Metro-Goldwyn-Mayer movies with official trailers, cast lists, and streaming information.',
  },
  {
    slug: 'columbia-pictures',
    name: 'Columbia Pictures',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [5],
    tagline: 'Classic studio storytelling, superhero blockbusters, and acclaimed comedies.',
    description:
      'Browse Columbia Pictures movies with official trailers, synopses, ratings, and global viewing availability.',
  },
  {
    slug: 'walt-disney-pictures',
    name: 'Walt Disney Pictures',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [2],
    tagline: 'Timeless family cinema, animated features, and live-action epics.',
    description:
      'Watch trailers and explore Walt Disney Pictures films with release dates, runtimes, voice & live-action casts, and where to stream.',
  },
  {
    slug: '20th-century-studios',
    name: '20th Century Studios',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [127928],
    tagline: 'Iconic sci-fi franchises, big-budget action, and director-driven dramas.',
    description:
      'Explore 20th Century Studios movies complete with trailers, cast credits, audience scores, and streaming availability.',
  },
  {
    slug: 'dreamworks-animation',
    name: 'DreamWorks Animation',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [521],
    tagline: 'Inventive animated comedies, fantasy worlds, and family crowd-pleasers.',
    description:
      'Browse DreamWorks Animation feature films with official trailers, voice casts, runtimes, and streaming guides.',
  },
  {
    slug: 'focus-features',
    name: 'Focus Features',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [10146],
    tagline: 'Director-driven prestige cinema, festival standouts, and international crossovers.',
    description:
      'Discover Focus Features films with official trailers, cast lists, critical favorites, and where to watch.',
  },
  {
    slug: 'searchlight-pictures',
    name: 'Searchlight Pictures',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [127929],
    tagline: 'Award-winning comedies, razor-sharp satires, and modern auteur dramas.',
    description:
      'Explore Searchlight Pictures movies complete with official trailers, directors, casts, ratings, and streaming platforms.',
  },
  {
    slug: 'neon',
    name: 'NEON',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [90733],
    tagline: 'Palme d’Or winners, fearless indie cinema, and viral genre sensations.',
    description:
      'Browse NEON movies with official trailers, audience ratings, cast credits, and streaming availability.',
  },
  {
    slug: 'lucasfilm',
    name: 'Lucasfilm',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [1],
    tagline: 'Legendary sci-fi space operas and big-screen adventure classics.',
    description:
      'Discover Lucasfilm movies with official trailers, chronological release dates, cast guides, and streaming options.',
  },
  {
    slug: 'apple-studios',
    name: 'Apple Studios',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [194232],
    tagline: 'Auteur theatrical releases and prestige Apple TV originals.',
    description:
      'Watch trailers and browse Apple Studios films complete with cast lists, runtimes, ratings, and viewing options.',
  },
  {
    slug: 'sony-pictures',
    name: 'Sony Pictures',
    region: 'us',
    countryLabel: 'United States',
    tmdbIds: [34],
    tagline: 'Global entertainment spanning action, animation, thrillers, and prestige releases.',
    description:
      'Explore Sony Pictures films with verified trailers, audience ratings, cast filmographies, and where to watch.',
  },

  // Europe
  {
    slug: 'bbc-film',
    name: 'BBC Film',
    region: 'europe',
    countryLabel: 'United Kingdom',
    tmdbIds: [288],
    tagline: 'Acclaimed British independent cinema, BAFTA winners, and gripping dramas.',
    description:
      'Browse BBC Film movies with official trailers, British cast and crew credits, ratings, and streaming availability.',
  },
  {
    slug: 'bfi',
    name: 'BFI (British Film Institute)',
    region: 'europe',
    countryLabel: 'United Kingdom',
    tmdbIds: [7281],
    tagline: 'Distinctive UK cinema, festival gems, and visionary British filmmakers.',
    description:
      'Discover British Film Institute (BFI) backed movies with official trailers, synopses, casts, and streaming platforms.',
  },
  {
    slug: 'studiocanal',
    name: 'StudioCanal',
    region: 'europe',
    countryLabel: 'France & Europe',
    tmdbIds: [218178, 694],
    tagline: 'Europe’s premier studio for acclaimed thrillers, family hits, and prestige cinema.',
    description:
      'Explore StudioCanal movies across UK, French, and international co-productions with official trailers, ratings, and streaming options.',
  },
  {
    slug: 'film4',
    name: 'Film4 Productions',
    region: 'europe',
    countryLabel: 'United Kingdom',
    tmdbIds: [6705],
    tagline: 'Bold British and international cinema from acclaimed modern auteurs.',
    description:
      'Browse Film4 Productions movies complete with official trailers, directors, casts, and where to watch.',
  },
  {
    slug: 'pathe',
    name: 'Pathé',
    region: 'europe',
    countryLabel: 'France',
    tmdbIds: [7981],
    tagline: 'French theatrical epics, European prestige drama, and international hits.',
    description:
      'Discover Pathé films with verified official trailers, cast lists, ratings, and streaming availability.',
  },
  {
    slug: 'gaumont',
    name: 'Gaumont',
    region: 'europe',
    countryLabel: 'France',
    tmdbIds: [206133, 9],
    tagline: 'Cinema’s oldest film studio, blending French classics with contemporary hits.',
    description:
      'Explore Gaumont movies with official trailers, synopses, French and international cast credits, and viewing guides.',
  },
  {
    slug: 'arte-france-cinema',
    name: 'ARTE France Cinéma',
    region: 'europe',
    countryLabel: 'France & Germany',
    tmdbIds: [94],
    tagline: 'Cannes, Venice, and Berlinale festival favorites from European & world auteurs.',
    description:
      'Browse ARTE France Cinéma films with official trailers, festival highlights, cast credits, and streaming options.',
  },
  {
    slug: 'rai-cinema',
    name: 'RAI Cinema',
    region: 'europe',
    countryLabel: 'Italy',
    tmdbIds: [155990, 2683],
    tagline: 'Contemporary Italian cinema, European drama, and acclaimed co-productions.',
    description:
      'Discover RAI Cinema movies complete with official trailers, Italian directors, casts, and where to watch.',
  },
  {
    slug: 'constantin-film',
    name: 'Constantin Film',
    region: 'europe',
    countryLabel: 'Germany',
    tmdbIds: [47],
    tagline: 'Germany’s leading theatrical studio across action, sci-fi, and European cinema.',
    description:
      'Explore Constantin Film releases with official trailers, ratings, casts, and global streaming options.',
  },
  {
    slug: 'film-i-vast',
    name: 'Film i Väst',
    region: 'europe',
    countryLabel: 'Sweden & Nordics',
    tmdbIds: [2801],
    tagline: 'Nordic cinema powerhouse behind acclaimed Scandinavian dramas and thrillers.',
    description:
      'Browse Film i Väst movies across Sweden, Denmark, and Norway with official trailers, ratings, and streaming guides.',
  },

  // Asia
  {
    slug: 'toho',
    name: 'TOHO',
    region: 'asia',
    countryLabel: 'Japan',
    tmdbIds: [882],
    tagline: 'Home of Godzilla, record-breaking anime theatrical hits, and Japanese classics.',
    description:
      'Explore TOHO movies from Japan—spanning kaiju blockbusters, anime phenomena, and acclaimed live-action cinema—with official trailers and streaming guides.',
  },
  {
    slug: 'kadokawa',
    name: 'KADOKAWA',
    region: 'asia',
    countryLabel: 'Japan',
    tmdbIds: [2073],
    tagline: 'Japanese theatrical anime, suspense thrillers, and cultural adaptations.',
    description:
      'Browse KADOKAWA movies with verified official trailers, Japanese casts, release years, and where to stream.',
  },
  {
    slug: 'shochiku',
    name: 'Shochiku',
    region: 'asia',
    countryLabel: 'Japan',
    tmdbIds: [192],
    tagline: 'Historic Japanese film studio blending acclaimed dramas, anime, and genre hits.',
    description:
      'Discover Shochiku films with official trailers, synopses, cast credits, and viewing options.',
  },
  {
    slug: 'cj-enm',
    name: 'CJ Entertainment & CJ ENM',
    region: 'asia',
    countryLabel: 'South Korea',
    tmdbIds: [7036, 128404],
    tagline: 'South Korea’s global cinema powerhouse behind Oscar winners and thriller hits.',
    description:
      'Explore CJ Entertainment and CJ ENM Korean movies with official trailers, ratings, casts, and streaming platforms.',
  },
  {
    slug: 'lotte-entertainment',
    name: 'Lotte Entertainment',
    region: 'asia',
    countryLabel: 'South Korea',
    tmdbIds: [147411, 20064],
    tagline: 'Major Korean theatrical blockbusters, crime thrillers, and emotional dramas.',
    description:
      'Browse Lotte Entertainment movies complete with trailers, cast filmographies, ratings, and where to watch.',
  },
  {
    slug: 'showbox',
    name: 'Showbox',
    region: 'asia',
    countryLabel: 'South Korea',
    tmdbIds: [3491],
    tagline: 'Hit Korean horror, crime thrillers, and box-office sensations.',
    description:
      'Discover Showbox Korean movies with official trailers, synopses, casts, and global streaming options.',
  },
  {
    slug: 'toei-animation',
    name: 'Toei Animation',
    region: 'asia',
    countryLabel: 'Japan',
    tmdbIds: [5542],
    tagline: 'Iconic theatrical anime movies spanning action, adventure, and shonen legends.',
    description:
      'Watch trailers and browse Toei Animation feature films with release dates, runtimes, and streaming availability.',
  },
  {
    slug: 'production-ig',
    name: 'Production I.G',
    region: 'asia',
    countryLabel: 'Japan',
    tmdbIds: [529],
    tagline: 'Cyberpunk sci-fi landmarks, sports anime features, and visionary animation.',
    description:
      'Explore Production I.G anime films with official trailers, ratings, cast credits, and where to stream.',
  },
  {
    slug: 'dharma-productions',
    name: 'Dharma Productions',
    region: 'asia',
    countryLabel: 'India',
    tmdbIds: [19146],
    tagline: 'Bollywood crowd-pleasers, modern romances, and sweeping Hindi blockbusters.',
    description:
      'Browse Dharma Productions Bollywood movies with official trailers, stars, ratings, and streaming guides.',
  },
  {
    slug: 'yash-raj-films',
    name: 'Yash Raj Films',
    region: 'asia',
    countryLabel: 'India',
    tmdbIds: [1569],
    tagline: 'Iconic Hindi action spectacles, spy thrillers, and unforgettable romances.',
    description:
      'Discover Yash Raj Films (YRF) movies with official trailers, casts, runtimes, and where to watch.',
  },
];

const STUDIO_BY_SLUG = new Map(STUDIO_CATALOG.map((item) => [item.slug, item]));
const STUDIO_BY_TMDB_ID = new Map<number, StudioCatalogItem>();
const STUDIO_BY_LOWER_NAME = new Map<string, StudioCatalogItem>();

for (const studio of STUDIO_CATALOG) {
  STUDIO_BY_LOWER_NAME.set(studio.name.toLowerCase(), studio);
  for (const id of studio.tmdbIds) {
    if (!STUDIO_BY_TMDB_ID.has(id)) {
      STUDIO_BY_TMDB_ID.set(id, studio);
    }
  }
}

export function getStudioBySlug(slug: string): StudioCatalogItem | null {
  return STUDIO_BY_SLUG.get(slug.toLowerCase()) || null;
}

export function matchMovieStudios(
  companies: Array<{ company?: { tmdbId?: number | null; name?: string | null } | null }> | null | undefined,
  limit = 2,
): StudioCatalogItem[] {
  if (!Array.isArray(companies) || companies.length === 0) return [];
  const seen = new Set<string>();
  const matched: StudioCatalogItem[] = [];
  for (const entry of companies) {
    const company = entry?.company;
    if (!company) continue;
    const hit =
      (typeof company.tmdbId === 'number' ? STUDIO_BY_TMDB_ID.get(company.tmdbId) : undefined) ||
      (company.name ? STUDIO_BY_LOWER_NAME.get(company.name.trim().toLowerCase()) : undefined);
    if (hit && !seen.has(hit.slug)) {
      seen.add(hit.slug);
      matched.push(hit);
      if (matched.length >= limit) break;
    }
  }
  return matched;
}

export function buildStudioFaqs(input: {
  studio: StudioCatalogItem;
  total: number;
  highlights: string[];
}): MovieFaqItem[] {
  const topList = input.highlights.slice(0, 4).join(', ');
  return [
    {
      question: `How many ${input.studio.name} movies are listed on MovieFlix?`,
      answer: `MovieFlix currently indexes ${input.total.toLocaleString('en-US')} quality-verified ${input.studio.name} films (${input.studio.countryLabel}) with official YouTube trailers, posters, synopses, cast credits, and streaming availability.`,
    },
    ...(topList
      ? [
          {
            question: `What are the most popular ${input.studio.name} movies to watch?`,
            answer: `Popular ${input.studio.name} titles on MovieFlix include ${topList}. Open any title to watch its official trailer, check audience ratings, and see where it streams in your region.`,
          },
        ]
      : []),
    {
      question: `Where can I stream ${input.studio.name} movies online?`,
      answer: `Streaming, rental, and digital purchase rights for ${input.studio.name} titles vary across the US, Europe, and Asia. Each movie page displays verified regional availability across Netflix, Prime Video, Disney+, Apple TV, Max, Sky, Rakuten TV, and more.`,
    },
  ];
}
