import type { MovieFaqItem } from './movie-aeo';

export interface FranchiseMovieSummary {
  id: string;
  title: string;
  slug: string;
  posterUrl: string | null;
  releaseDate: Date | string | null;
  runtimeMinutes: number | null;
  voteAverage: number | null;
  mpaaRating: string | null;
}

export function cleanFranchiseName(rawTitle: string): string {
  const trimmed = rawTitle.replace(/\s+/g, ' ').trim();
  const stripped = trimmed.replace(/\s+(?:movie\s+)?collection$/i, '').trim();
  return stripped || trimmed;
}

export function formatMarathonRuntime(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export interface FranchiseWatchGuide {
  franchiseName: string;
  metaTitle: string;
  heading: string;
  metaDescription: string;
  intro: string;
  totalRuntimeMinutes: number;
  marathonLabel: string | null;
  yearRange: string | null;
  firstMovie: FranchiseMovieSummary | null;
  latestMovie: FranchiseMovieSummary | null;
  highestRatedMovie: FranchiseMovieSummary | null;
  faqs: MovieFaqItem[];
  indexable: boolean;
}

export function buildFranchiseWatchGuide(input: {
  title: string;
  description?: string | null;
  movies: FranchiseMovieSummary[];
  totalMovies: number;
  page?: number;
}): FranchiseWatchGuide {
  const franchiseName = cleanFranchiseName(input.title);
  const page = input.page ?? 1;
  const count = Math.max(input.totalMovies, input.movies.length);

  const chronologicallySorted = [...input.movies].sort((a, b) => {
    const aTime = a.releaseDate ? new Date(a.releaseDate).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.releaseDate ? new Date(b.releaseDate).getTime() : Number.POSITIVE_INFINITY;
    if (aTime !== bTime) return aTime - bTime;
    return a.title.localeCompare(b.title);
  });

  const dated = chronologicallySorted.filter((m) => m.releaseDate && Number.isFinite(new Date(m.releaseDate).getTime()));
  const firstMovie = dated[0] ?? chronologicallySorted[0] ?? null;
  const latestMovie = dated.length > 0 ? dated[dated.length - 1] : chronologicallySorted[chronologicallySorted.length - 1] ?? null;
  const firstYear = firstMovie?.releaseDate ? new Date(firstMovie.releaseDate).getUTCFullYear() : null;
  const latestYear = latestMovie?.releaseDate ? new Date(latestMovie.releaseDate).getUTCFullYear() : null;
  const yearRange =
    firstYear && latestYear
      ? firstYear === latestYear
        ? String(firstYear)
        : `${firstYear}–${latestYear}`
      : null;

  const totalRuntimeMinutes = input.movies.reduce(
    (sum, movie) => sum + (typeof movie.runtimeMinutes === 'number' && movie.runtimeMinutes > 0 ? movie.runtimeMinutes : 0),
    0,
  );
  const marathonLabel = totalRuntimeMinutes > 0 ? formatMarathonRuntime(totalRuntimeMinutes) : null;

  const ratedMovies = input.movies.filter((m) => typeof m.voteAverage === 'number' && m.voteAverage > 0);
  const highestRatedMovie = ratedMovies.length > 0
    ? [...ratedMovies].sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))[0]
    : null;

  const metaTitle = `${franchiseName} Movies in Order — Watch Guide & Trailers${page > 1 ? ` (Page ${page})` : ''}`;
  const heading = `${franchiseName} Movies in Order`;

  const runtimeBit = marathonLabel ? ` Total marathon runtime: ${marathonLabel}.` : '';
  const firstBit = firstMovie && firstYear ? ` Start with ${firstMovie.title} (${firstYear})` : '';
  const latestBit =
    latestMovie && latestYear && latestMovie.id !== firstMovie?.id
      ? ` through ${latestMovie.title} (${latestYear}).`
      : firstBit
        ? '.'
        : '';

  const fallbackDescription =
    `Complete watch order for all ${count} ${franchiseName} movies${yearRange ? ` (${yearRange})` : ''}.${firstBit}${latestBit}${runtimeBit} Watch official trailers, ratings, and where to stream on MovieFlix.`;

  const metaDescription = input.description?.trim()
    ? `${input.description.trim()} Watch all ${count} ${franchiseName} movies in release order with official trailers and streaming guides.`
    : fallbackDescription;

  const intro = input.description?.trim()
    ? input.description.trim()
    : `Follow the complete chronological release order for all ${count} published ${franchiseName} films${yearRange ? ` spanning ${yearRange}` : ''}.${runtimeBit} Open any entry below to watch its official trailer, check cast credits, and find regional streaming platforms.`;

  const faqs: MovieFaqItem[] = [];
  if (chronologicallySorted.length > 0) {
    const orderList = chronologicallySorted
      .slice(0, 12)
      .map((m, idx) => {
        const y = m.releaseDate ? new Date(m.releaseDate).getUTCFullYear() : null;
        return `${idx + 1}. ${m.title}${y ? ` (${y})` : ''}`;
      })
      .join(', ');
    faqs.push({
      question: `How do you watch all ${franchiseName} movies in order?`,
      answer: `Watch the ${count} ${franchiseName} movies in release order starting from the first installment: ${orderList}${chronologicallySorted.length > 12 ? `, plus ${chronologicallySorted.length - 12} more entries listed above` : ''}.`,
    });
  }

  if (marathonLabel) {
    faqs.push({
      question: `How long does it take to watch all ${franchiseName} movies?`,
      answer: `Watching the ${count} listed ${franchiseName} films back-to-back takes approximately ${marathonLabel} (${totalRuntimeMinutes.toLocaleString('en-US')} minutes total) based on verified runtimes.`,
    });
  }

  if (highestRatedMovie && highestRatedMovie.voteAverage) {
    const y = highestRatedMovie.releaseDate ? new Date(highestRatedMovie.releaseDate).getUTCFullYear() : null;
    faqs.push({
      question: `Which ${franchiseName} movie is the highest rated?`,
      answer: `Based on audience ratings in the MovieFlix catalog, ${highestRatedMovie.title}${y ? ` (${y})` : ''} leads the series with a ${highestRatedMovie.voteAverage.toFixed(1)}/10 score.`,
    });
  }

  if (latestMovie) {
    const y = latestMovie.releaseDate ? new Date(latestMovie.releaseDate).getUTCFullYear() : null;
    faqs.push({
      question: `What is the latest ${franchiseName} movie?`,
      answer: `The most recent published release in this guide is ${latestMovie.title}${y ? ` (${y})` : ''}. Open its MovieFlix page to watch the official trailer and check regional streaming availability.`,
    });
  }

  return {
    franchiseName,
    metaTitle,
    heading,
    metaDescription,
    intro,
    totalRuntimeMinutes,
    marathonLabel,
    yearRange,
    firstMovie,
    latestMovie,
    highestRatedMovie,
    faqs,
    indexable: count >= 2,
  };
}
