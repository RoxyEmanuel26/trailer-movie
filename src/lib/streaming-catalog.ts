export interface StreamingCatalogItem {
  slug: string;
  label: string;
  tmdbIds: number[];
  accessLabel: string;
  tagline: string;
  description: string;
}

export const STREAMING_CATALOG: StreamingCatalogItem[] = [
  {
    slug: 'netflix',
    label: 'Netflix',
    tmdbIds: [8, 175, 1796],
    accessLabel: 'Subscription streaming',
    tagline: 'Original films, global blockbusters, and award-winning cinema streaming on Netflix.',
    description:
      'Discover movies available on Netflix across regions, complete with official trailers, cast and crew profiles, audience ratings, runtime, and story guides on MovieFlix.',
  },
  {
    slug: 'prime-video',
    label: 'Prime Video',
    tmdbIds: [9, 119, 613, 2100],
    accessLabel: 'Subscription, rental & purchase',
    tagline: 'Amazon Originals, theatrical hits, and deep genre classics on Prime Video.',
    description:
      'Browse movies available to stream, rent, or buy on Amazon Prime Video, with official trailers, cast details, ratings, and release facts.',
  },
  {
    slug: 'disney-plus',
    label: 'Disney+',
    tmdbIds: [337, 122],
    accessLabel: 'Subscription streaming',
    tagline: 'Disney, Pixar, Marvel, Star Wars, and family adventure films on Disney+.',
    description:
      'Explore movies streaming on Disney+, featuring official trailers, voice and live-action cast credits, runtime, age ratings, and story synopses.',
  },
  {
    slug: 'apple-tv',
    label: 'Apple TV',
    tmdbIds: [350, 2],
    accessLabel: 'Subscription, rental & purchase',
    tagline: 'Apple Original Films and premier digital theatrical releases on Apple TV.',
    description:
      'Find movies available on Apple TV and Apple TV Store, with high-definition trailers, director and cast credits, audience scores, and viewing details.',
  },
  {
    slug: 'max',
    label: 'Max',
    tmdbIds: [1899, 425],
    accessLabel: 'Subscription streaming',
    tagline: 'Warner Bros. theatrical releases, HBO films, and acclaimed cinema on Max.',
    description:
      'Browse movies streaming on Max and HBO services, including official trailers, full cast and crew credits, genres, and release timelines.',
  },
  {
    slug: 'hulu',
    label: 'Hulu',
    tmdbIds: [15],
    accessLabel: 'Subscription streaming',
    tagline: 'Contemporary indie standouts, studio hits, and genre favorites on Hulu.',
    description:
      'Explore movies available on Hulu with official trailers, cast and director guides, ratings, and regional streaming context.',
  },
  {
    slug: 'paramount-plus',
    label: 'Paramount+',
    tmdbIds: [531, 1770, 2303, 2304, 2616],
    accessLabel: 'Subscription streaming',
    tagline: 'Paramount Pictures franchises, action tentpoles, and Showtime features.',
    description:
      'Discover movies streaming on Paramount+, complete with official trailers, cast lists, runtime, age classifications, and related film recommendations.',
  },
  {
    slug: 'peacock',
    label: 'Peacock',
    tmdbIds: [386, 387],
    accessLabel: 'Subscription streaming',
    tagline: 'Universal Pictures releases, horror hits, and classic cinema on Peacock.',
    description:
      'Browse movies streaming on Peacock with official trailers, cast and crew credits, audience ratings, and genre breakdowns.',
  },
  {
    slug: 'vidio',
    label: 'Vidio',
    tmdbIds: [489],
    accessLabel: 'Subscription & freemium streaming',
    tagline: 'Indonesian box-office hits, Asian cinema, and Hollywood favorites on Vidio.',
    description:
      'Explore Indonesian, Asian, and international movies streaming on Vidio, featuring trailers, cast credits, release years, and story summaries.',
  },
  {
    slug: 'viu',
    label: 'Viu',
    tmdbIds: [158],
    accessLabel: 'Subscription & ad-supported streaming',
    tagline: 'Korean, Japanese, Thai, and Indonesian films available to stream on Viu.',
    description:
      'Discover Korean, Japanese, Southeast Asian, and regional movies available on Viu, with trailers, cast profiles, ratings, and synopses.',
  },
  {
    slug: 'catchplay-plus',
    label: 'Catchplay+',
    tmdbIds: [159],
    accessLabel: 'Subscription & single-title rental',
    tagline: 'Fresh theatrical releases, Asian cinema, and festival selections on Catchplay+.',
    description:
      'Browse movies available on Catchplay+ with official trailers, cast and director details, runtime, and audience ratings.',
  },
  {
    slug: 'tubi',
    label: 'Tubi',
    tmdbIds: [73],
    accessLabel: 'Free ad-supported streaming',
    tagline: 'Thousands of cult classics, action thrillers, and genre gems free with ads on Tubi.',
    description:
      'Explore movies streaming free with ads on Tubi, complete with trailers, cast and crew information, genres, and release years.',
  },
  {
    slug: 'plex',
    label: 'Plex',
    tmdbIds: [538],
    accessLabel: 'Free ad-supported & on-demand',
    tagline: 'Free ad-supported movies, independent cinema, and global catalog picks on Plex.',
    description:
      'Browse movies available on Plex with official trailers, cast credits, audience scores, and genre tags.',
  },
  {
    slug: 'mubi',
    label: 'MUBI',
    tmdbIds: [11],
    accessLabel: 'Curated arthouse streaming',
    tagline: 'Festival winners, auteur cinema, and restored world classics curated on MUBI.',
    description:
      'Discover festival favorites, international cinema, and director-driven films streaming on MUBI, with trailers, credits, and editorial facts.',
  },
  {
    slug: 'crunchyroll',
    label: 'Crunchyroll',
    tmdbIds: [283],
    accessLabel: 'Anime streaming',
    tagline: 'Theatrical anime features, fantasy adventures, and Japanese animation on Crunchyroll.',
    description:
      'Explore anime movies and theatrical features streaming on Crunchyroll, with official trailers, voice cast, directors, and release details.',
  },
  {
    slug: 'google-play',
    label: 'Google Play Movies',
    tmdbIds: [3],
    accessLabel: 'Digital rental & purchase',
    tagline: 'New home-premiere rentals and digital movie purchases on Google Play.',
    description:
      'Find movies available to rent or buy on Google Play Movies, complete with trailers, cast and crew profiles, runtime, and ratings.',
  },
  {
    slug: 'youtube',
    label: 'YouTube Movies',
    tmdbIds: [192, 188],
    accessLabel: 'Digital rental, purchase & free',
    tagline: 'On-demand digital rentals, purchases, and official features on YouTube.',
    description:
      'Browse movies available on YouTube Movies and YouTube Premium with official trailers, cast lists, ratings, and release facts.',
  },
];

export function getStreamingCatalogItem(slug: string) {
  return STREAMING_CATALOG.find((item) => item.slug === slug);
}

const NORMALIZED_NAME_TO_SLUG: Record<string, string> = {
  netflix: 'netflix',
  'prime video': 'prime-video',
  'amazon prime video': 'prime-video',
  'disney+': 'disney-plus',
  'disney plus': 'disney-plus',
  'apple tv': 'apple-tv',
  max: 'max',
  'hbo max': 'max',
  hulu: 'hulu',
  'paramount+': 'paramount-plus',
  'paramount plus': 'paramount-plus',
  peacock: 'peacock',
  vidio: 'vidio',
  viu: 'viu',
  'catchplay+': 'catchplay-plus',
  catchplay: 'catchplay-plus',
  tubi: 'tubi',
  'tubi tv': 'tubi',
  plex: 'plex',
  mubi: 'mubi',
  crunchyroll: 'crunchyroll',
  'google play': 'google-play',
  'google play movies': 'google-play',
  youtube: 'youtube',
  'youtube movies': 'youtube',
};

export function matchStreamingCatalogSlug(providerName: string): string | null {
  return NORMALIZED_NAME_TO_SLUG[providerName.trim().toLowerCase()] || null;
}
