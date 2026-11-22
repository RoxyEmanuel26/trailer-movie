import { extractUniqueProviders, type MovieFaqItem } from './movie-aeo';

export const MOVIES_LIKE_MIN_VOTES = 100;
export const MOVIES_LIKE_MIN_RECOMMENDATIONS = 6;
export const MOVIES_LIKE_DISPLAY_LIMIT = 18;
export const MOVIES_LIKE_SITEMAP_PAGE_SIZE = 10_000;

export interface SimilarMovieCandidateInput {
  id: string;
  title: string;
  slug: string;
  posterUrl: string | null;
  backdropUrl?: string | null;
  synopsis?: string | null;
  releaseDate: Date | string | null;
  runtimeMinutes: number | null;
  mpaaRating: string | null;
  voteAverage: number | null;
  voteCount?: number | null;
  genres: Array<{ genre: { name: string; slug: string } }>;
  keywords?: Array<{ keyword: { name: string } }>;
  directors?: string[];
  watchProviderLinks?: Array<{ provider?: { name?: string | null } | null }>;
  watchProviders?: unknown;
}

export interface SimilarMovieSourceInput {
  id: string;
  title: string;
  slug: string;
  releaseDate: Date | string | null;
  runtimeMinutes: number | null;
  voteAverage: number | null;
  voteCount: number | null;
  importQualityStatus?: string | null;
  genres: Array<{ genre: { name: string; slug: string } }>;
  keywords?: Array<{ keyword: { name: string } }>;
  directors?: string[];
}

export interface AnalyzedSimilarMovie {
  movie: SimilarMovieCandidateInput;
  year: number | null;
  sharedGenres: string[];
  sharedKeywords: string[];
  sharedDirectors: string[];
  runtimeComparison: string | null;
  providerNames: string[];
  reasonText: string;
}

const GENERIC_KEYWORDS = new Set([
  'aftercreditsstinger',
  'duringcreditsstinger',
  'based on novel or book',
  'sequel',
  'independent film',
  'woman director',
  'short film',
]);

export function isEligibleForMoviesLikeIndex(input: {
  importQualityStatus?: string | null;
  voteCount?: number | null;
  recommendationCount: number;
}): boolean {
  return (
    input.importQualityStatus === 'READY' &&
    (input.voteCount ?? 0) >= MOVIES_LIKE_MIN_VOTES &&
    input.recommendationCount >= MOVIES_LIKE_MIN_RECOMMENDATIONS
  );
}

export function formatRuntimeDelta(sourceMinutes: number | null, candidateMinutes: number | null): string | null {
  if (!sourceMinutes || !candidateMinutes || sourceMinutes <= 0 || candidateMinutes <= 0) return null;
  const diff = candidateMinutes - sourceMinutes;
  if (Math.abs(diff) <= 5) return 'Similar runtime';
  if (diff < 0) return `${Math.abs(diff)} min shorter`;
  return `${diff} min longer`;
}

export function analyzeMovieSimilarity(
  source: SimilarMovieSourceInput,
  candidate: SimilarMovieCandidateInput,
): AnalyzedSimilarMovie {
  const sourceGenreSet = new Set(source.genres.map((g) => g.genre.name.toLowerCase()));
  const sharedGenres = candidate.genres
    .map((g) => g.genre.name)
    .filter((name) => sourceGenreSet.has(name.toLowerCase()))
    .slice(0, 3);

  const sourceKeywordSet = new Set(
    (source.keywords || [])
      .map((k) => k.keyword.name.trim().toLowerCase())
      .filter((k) => k.length > 2 && !GENERIC_KEYWORDS.has(k)),
  );
  const sharedKeywords = (candidate.keywords || [])
    .map((k) => k.keyword.name.trim())
    .filter((name) => sourceKeywordSet.has(name.toLowerCase()))
    .slice(0, 3);

  const sourceDirectors = new Set((source.directors || []).map((d) => d.trim().toLowerCase()));
  const sharedDirectors = (candidate.directors || []).filter((d) => sourceDirectors.has(d.trim().toLowerCase()));

  const runtimeComparison = formatRuntimeDelta(source.runtimeMinutes, candidate.runtimeMinutes);
  const { names: providerNames } = extractUniqueProviders(
    candidate.watchProviderLinks,
    candidate.watchProviders,
  );
  const year = candidate.releaseDate ? new Date(candidate.releaseDate).getUTCFullYear() : null;

  const reasons: string[] = [];
  if (sharedDirectors.length > 0) {
    reasons.push(`Same director (${sharedDirectors[0]})`);
  }
  if (sharedKeywords.length > 0) {
    reasons.push(`Shared themes: ${sharedKeywords.slice(0, 2).join(', ')}`);
  }
  if (sharedGenres.length > 0) {
    reasons.push(`Matches ${sharedGenres.slice(0, 2).join(' & ')}`);
  }
  if (reasons.length === 0) {
    const candidateGenres = candidate.genres.slice(0, 2).map((g) => g.genre.name).join(' & ');
    reasons.push(candidateGenres ? `Audience-matched ${candidateGenres} pick` : 'Audience-recommended match');
  }

  return {
    movie: candidate,
    year,
    sharedGenres,
    sharedKeywords,
    sharedDirectors,
    runtimeComparison,
    providerNames: providerNames.slice(0, 4),
    reasonText: reasons.join(' · '),
  };
}

export function buildMoviesLikeGuideContent(
  source: SimilarMovieSourceInput,
  analyzed: AnalyzedSimilarMovie[],
) {
  const sourceYear = source.releaseDate ? new Date(source.releaseDate).getUTCFullYear() : null;
  const titleWithYear = sourceYear ? `${source.title} (${sourceYear})` : source.title;
  const count = analyzed.length;
  const topNames = analyzed.slice(0, 3).map((item) => item.movie.title);
  const topHighlightText =
    topNames.length === 3
      ? `${topNames[0]}, ${topNames[1]}, and ${topNames[2]}`
      : topNames.join(' and ');

  const metaTitle =
    source.title.length <= 28
      ? `${count} Best Movies Like ${titleWithYear} — Trailers & Where to Watch`
      : `Best Movies Like ${source.title} — Ranked & Where to Watch`;

  const heading = `Movies Like ${source.title}`;
  const metaDescription = topHighlightText
    ? `Looking for movies like ${titleWithYear}? Compare ${count} curated picks including ${topHighlightText} with shared themes, runtimes, ratings, official trailers, and streaming platforms.`
    : `Discover ${count} curated movies like ${titleWithYear} with official trailers, audience ratings, runtime comparisons, and regional streaming options on MovieFlix.`;

  const primaryGenres = source.genres.slice(0, 3).map((g) => g.genre.name.toLowerCase()).join(', ');
  const intro =
    `If you enjoyed ${titleWithYear}${primaryGenres ? ` for its ${primaryGenres} storytelling` : ''}, these ${count} audience-matched recommendations deliver a similar tone, pacing, or thematic hook.` +
    `${topHighlightText ? ` Standout picks include ${topHighlightText}.` : ''} Compare shared themes, runtimes, ratings, and regional streaming options below.`;

  const highestRated = [...analyzed]
    .filter((item) => (item.movie.voteAverage ?? 0) > 0)
    .sort((a, b) => (b.movie.voteAverage || 0) - (a.movie.voteAverage || 0))[0];

  const shortestPick = [...analyzed]
    .filter((item) => (item.movie.runtimeMinutes ?? 0) >= 60)
    .sort((a, b) => (a.movie.runtimeMinutes || 999) - (b.movie.runtimeMinutes || 999))[0];

  const streamingProviders = Array.from(
    new Set(analyzed.flatMap((item) => item.providerNames)),
  ).slice(0, 5);

  const faqs: MovieFaqItem[] = [];
  if (topHighlightText) {
    faqs.push({
      question: `What are the best movies like ${source.title}?`,
      answer: `Top audience-matched movies similar to ${titleWithYear} include ${topHighlightText}. Each recommendation on this MovieFlix guide includes shared genre and theme overlaps, runtime comparisons, and an official trailer.`,
    });
  }
  if (highestRated && highestRated.movie.voteAverage) {
    faqs.push({
      question: `Which movie like ${source.title} has the highest rating?`,
      answer: `Among the ${count} recommended titles similar to ${source.title}, ${highestRated.movie.title}${highestRated.year ? ` (${highestRated.year})` : ''} holds the highest audience score at ${highestRated.movie.voteAverage.toFixed(1)}/10.`,
    });
  }
  if (shortestPick && shortestPick.movie.runtimeMinutes) {
    faqs.push({
      question: `What is a shorter movie like ${source.title} to watch tonight?`,
      answer: `${shortestPick.movie.title}${shortestPick.year ? ` (${shortestPick.year})` : ''} is the tightest pick on this list at ${shortestPick.movie.runtimeMinutes} minutes${source.runtimeMinutes ? ` compared to ${source.title}'s ${source.runtimeMinutes}-minute runtime` : ''}.`,
    });
  }
  if (streamingProviders.length > 0) {
    faqs.push({
      question: `Where can I stream movies like ${source.title}?`,
      answer: `Across our recommended list, titles are listed across services such as ${streamingProviders.join(', ')} depending on your region. Open any movie page to inspect live country-specific streaming, rental, and purchase options.`,
    });
  }

  return {
    sourceYear,
    titleWithYear,
    metaTitle,
    heading,
    metaDescription,
    intro,
    faqs,
  };
}
