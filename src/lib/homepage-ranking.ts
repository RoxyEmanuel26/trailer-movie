export type TrendingScoreInput = {
  id: string;
  popularity: number | null;
  voteCount: number | null;
  releaseDate: Date | null;
  views: number;
  trailerPlays: number;
};

function normalize(value: number, maximum: number) {
  return maximum > 0 ? Math.max(0, value) / maximum : 0;
}

function freshnessScore(releaseDate: Date | null, now: Date) {
  if (!releaseDate) return 0;
  const ageInDays = Math.max(0, (now.getTime() - releaseDate.getTime()) / 86_400_000);
  return Math.max(0, 1 - ageInDays / 365);
}

export function rankTrendingCandidates<T extends TrendingScoreInput>(candidates: T[], now = new Date()) {
  const maximums = candidates.reduce(
    (result, movie) => ({
      views: Math.max(result.views, movie.views),
      trailerPlays: Math.max(result.trailerPlays, movie.trailerPlays),
      popularity: Math.max(result.popularity, movie.popularity || 0),
      voteCount: Math.max(result.voteCount, movie.voteCount || 0),
      siteActivity: Math.max(result.siteActivity, movie.views + movie.trailerPlays),
    }),
    { views: 0, trailerPlays: 0, popularity: 0, voteCount: 0, siteActivity: 0 },
  );
  const interactions = candidates.reduce((total, movie) => total + movie.views + movie.trailerPlays, 0);
  const coldStart = interactions < 25;

  return candidates
    .map((movie) => {
      const freshness = freshnessScore(movie.releaseDate, now);
      const score = coldStart
        ? normalize(movie.popularity || 0, maximums.popularity) * 0.45
          + normalize(movie.voteCount || 0, maximums.voteCount) * 0.25
          + freshness * 0.2
          + normalize(movie.views + movie.trailerPlays, maximums.siteActivity) * 0.1
        : normalize(movie.views, maximums.views) * 0.45
          + normalize(movie.trailerPlays, maximums.trailerPlays) * 0.25
          + normalize(movie.popularity || 0, maximums.popularity) * 0.15
          + normalize(movie.voteCount || 0, maximums.voteCount) * 0.1
          + freshness * 0.05;
      return { ...movie, trendingScore: score, coldStart };
    })
    .sort((left, right) => right.trendingScore - left.trendingScore || left.id.localeCompare(right.id));
}

export function chooseDailyHero<T extends TrendingScoreInput>(ranked: T[], now = new Date()) {
  const top = ranked.slice(0, 12);
  const cutoff90 = new Date(now.getTime() - 90 * 86_400_000);
  const cutoff365 = new Date(now.getTime() - 365 * 86_400_000);
  const preferred = top.filter((movie) => movie.releaseDate && movie.releaseDate >= cutoff90);
  const secondary = top.filter((movie) => movie.releaseDate && movie.releaseDate >= cutoff365);
  const pool = preferred.length ? preferred : secondary.length ? secondary : top;
  if (!pool.length) return null;
  const utcDay = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86_400_000);
  return pool[utcDay % pool.length];
}
