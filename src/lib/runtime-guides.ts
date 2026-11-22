import type { MovieFaqItem } from './movie-aeo';
import type { RelatedGuideLink } from './programmatic-guides';

export type RuntimeGuideSlug = 'under-90-minutes' | 'under-2-hours';

export interface RuntimeGuideConfig {
  slug: RuntimeGuideSlug;
  path: string;
  eyebrow: string;
  title: string;
  metaTitle: string;
  description: string;
  metaDescription: string;
  minRuntimeMinutes: number;
  maxRuntimeMinutes: number;
  runtimeLabel: string;
  relatedLinks: RelatedGuideLink[];
  buildFaqs: (total: number, highlights: string[]) => MovieFaqItem[];
}

export const RUNTIME_GUIDES: Record<RuntimeGuideSlug, RuntimeGuideConfig> = {
  'under-90-minutes': {
    slug: 'under-90-minutes',
    path: '/movies/under-90-minutes',
    eyebrow: 'Quick watch guide',
    title: 'Best movies under 90 minutes',
    metaTitle: 'Best Movies Under 90 Minutes — Short Feature Films & Trailers',
    description:
      'Tightly paced feature films between 60 and 90 minutes long—perfect for a weeknight watch without the three-hour commitment. Ranked by audience popularity with official trailers and regional streaming guides.',
    metaDescription:
      'Discover the best feature movies under 90 minutes (60–90 min) with official trailers, audience ratings, cast credits, and where to stream on MovieFlix.',
    minRuntimeMinutes: 60,
    maxRuntimeMinutes: 90,
    runtimeLabel: '60–90 minutes',
    relatedLinks: [
      { href: '/movies/under-2-hours', label: 'Movies under 2 hours' },
      { href: '/popular/most-popular', label: 'Most popular movies' },
      { href: '/popular/top-rated', label: 'Top rated movies' },
      { href: '/streaming/netflix', label: 'Movies on Netflix' },
      { href: '/genre/comedy', label: 'Comedy movies' },
      { href: '/genre/horror', label: 'Horror movies' },
      { href: '/genre/thriller', label: 'Thriller movies' },
      { href: '/collections', label: 'Franchise watch orders' },
    ],
    buildFaqs: (total, highlights) => [
      {
        question: 'How many feature movies under 90 minutes are on MovieFlix?',
        answer: `MovieFlix currently catalogs ${total.toLocaleString('en-US')} published feature-length movies running between 60 and 90 minutes, filtering out short films under an hour so every pick is a complete feature.`,
      },
      ...(highlights.length > 0
        ? [
            {
              question: 'What are the most popular movies under 90 minutes right now?',
              answer: `Popular quick-watch feature films in this guide include ${highlights.slice(0, 3).join(', ')}. Open any card above to watch its official trailer and see where it is streaming.`,
            },
          ]
        : []),
      {
        question: 'Why does this guide start at 60 minutes instead of listing short films?',
        answer:
          'When viewers search for movies under 90 minutes, they usually want a compact full-length film for movie night rather than 10-minute shorts. Setting a 60-minute floor keeps the lineup focused on genuine feature films.',
      },
    ],
  },
  'under-2-hours': {
    slug: 'under-2-hours',
    path: '/movies/under-2-hours',
    eyebrow: 'Runtime guide',
    title: 'Best movies under 2 hours',
    metaTitle: 'Best Movies Under 2 Hours — Tight Feature Films & Trailers',
    description:
      'Complete feature films running between 60 and 120 minutes—from crisp thrillers and sci-fi standouts to comedies and dramas. Browse official trailers, ratings, cast profiles, and streaming availability.',
    metaDescription:
      'Browse the best feature movies under 2 hours (60–120 min) ranked by popularity on MovieFlix, complete with official trailers, ratings, and streaming platforms.',
    minRuntimeMinutes: 60,
    maxRuntimeMinutes: 120,
    runtimeLabel: '60–120 minutes',
    relatedLinks: [
      { href: '/movies/under-90-minutes', label: 'Movies under 90 minutes' },
      { href: '/popular/most-popular', label: 'Most popular movies' },
      { href: '/popular/top-rated', label: 'Top rated movies' },
      { href: '/popular/latest-releases', label: 'Latest releases' },
      { href: '/streaming', label: 'Browse by streaming service' },
      { href: '/collections', label: 'Franchise watch orders' },
    ],
    buildFaqs: (total, highlights) => [
      {
        question: 'How many feature films under 2 hours are listed on MovieFlix?',
        answer: `MovieFlix currently indexes ${total.toLocaleString('en-US')} published feature films running between 60 and 120 minutes, sorted by audience popularity.`,
      },
      ...(highlights.length > 0
        ? [
            {
              question: 'Which movies under 2 hours are most popular?',
              answer: `Standout films under two hours include ${highlights.slice(0, 3).join(', ')}. Click any title to watch its official trailer and compare streaming, rental, and purchase platforms.`,
            },
          ]
        : []),
    ],
  },
};
