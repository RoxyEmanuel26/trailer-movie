import type { MovieFaqItem } from './movie-aeo';

export type UpcomingRegionFilter = 'all' | 'us' | 'europe' | 'asia';

export interface UpcomingRegionConfig {
  slug: UpcomingRegionFilter;
  label: string;
  countryCodes: string[];
}

export const UPCOMING_REGIONS: Record<UpcomingRegionFilter, UpcomingRegionConfig> = {
  all: {
    slug: 'all',
    label: 'Global',
    countryCodes: [],
  },
  us: {
    slug: 'us',
    label: 'US & Hollywood',
    countryCodes: ['US', 'CA'],
  },
  europe: {
    slug: 'europe',
    label: 'Europe',
    countryCodes: ['GB', 'FR', 'DE', 'ES', 'IT', 'SE', 'NO', 'DK', 'BE', 'NL', 'IE', 'PL'],
  },
  asia: {
    slug: 'asia',
    label: 'Asia',
    countryCodes: ['JP', 'KR', 'IN', 'ID', 'HK', 'TW', 'TH', 'PH', 'CN', 'SG', 'MY'],
  },
};

export function parseUpcomingRegion(raw: string | string[] | undefined): UpcomingRegionFilter {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase();
  if (value === 'us' || value === 'europe' || value === 'asia') return value;
  return 'all';
}

export function isUpcomingReleaseDate(
  releaseDate: Date | string | null | undefined,
  now = new Date(),
): boolean {
  if (!releaseDate) return false;
  const parsed = releaseDate instanceof Date ? releaseDate : new Date(releaseDate);
  if (!Number.isFinite(parsed.getTime())) return false;
  return parsed.getTime() > now.getTime();
}

export function formatReleaseCountdown(
  releaseDate: Date | string | null | undefined,
  now = new Date(),
): string | null {
  if (!releaseDate) return null;
  const parsed = releaseDate instanceof Date ? releaseDate : new Date(releaseDate);
  if (!Number.isFinite(parsed.getTime())) return null;
  const diffMs = parsed.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const days = Math.ceil(diffMs / 86_400_000);
  if (days <= 1) return 'Releases tomorrow';
  if (days <= 13) return `In ${days} days`;
  if (days <= 59) {
    const weeks = Math.round(days / 7);
    return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  const months = Math.max(2, Math.round(days / 30));
  return `In ${months} months`;
}

export function formatUpcomingDateShort(releaseDate: Date | string | null | undefined): string | null {
  if (!releaseDate) return null;
  const parsed = releaseDate instanceof Date ? releaseDate : new Date(releaseDate);
  if (!Number.isFinite(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

export function buildUpcomingHubFaqs(input: {
  total: number;
  year?: number | null;
  highlights: string[];
}): MovieFaqItem[] {
  const scopeLabel = input.year ? `upcoming ${input.year} movies` : 'upcoming movies';
  const topList = input.highlights.slice(0, 4).join(', ');
  return [
    {
      question: input.year
        ? `How many upcoming ${input.year} movies already have official trailers on MovieFlix?`
        : 'How does MovieFlix choose which upcoming movies to publish early?',
      answer: input.year
        ? `MovieFlix currently tracks ${input.total.toLocaleString('en-US')} scheduled ${input.year} releases with verified official YouTube trailers, artwork, synopses, and cast lists.`
        : `MovieFlix only publishes upcoming titles within the next 18 months once an official YouTube trailer, verified poster, story synopsis, and release date are confirmed—filtering out unverified rumors and placeholders.`,
    },
    ...(topList
      ? [
          {
            question: input.year
              ? `What are the most anticipated ${input.year} movie trailers right now?`
              : 'What are the most anticipated upcoming movie trailers right now?',
            answer: `Top anticipated ${scopeLabel} currently trending across the US, Europe, and Asia include ${topList}. Open any title to watch its official trailer and track its theatrical countdown.`,
          },
        ]
      : []),
    {
      question: 'Do theatrical release dates differ between the US, Europe, and Asia?',
      answer:
        'Yes. Studios frequently stagger international cinema debuts by a few days or weeks across North America, Europe, and Asia. Dates shown reflect primary global theatrical schedules and update automatically as distributors confirm releases.',
    },
  ];
}
