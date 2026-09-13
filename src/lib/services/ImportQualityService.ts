import { MovieQualityStatus, MovieStatus, TrailerSource, TrailerStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from '../repositories/base.types';

export type MovieQualityIssue =
  | 'tmdb_not_released'
  | 'missing_title'
  | 'missing_release_date'
  | 'missing_synopsis'
  | 'missing_poster'
  | 'missing_genre'
  | 'missing_trailer';

export type MovieQualityInput = {
  title: string;
  releaseDate: Date | null;
  synopsis: string | null;
  posterUrl: string | null;
  productionStatus: string | null;
  youtubeTrailerId: string | null;
  genreCount: number;
  activeYoutubeTrailerCount: number;
};

export function evaluateMovieQuality(input: MovieQualityInput): MovieQualityIssue[] {
  const issues: MovieQualityIssue[] = [];
  if (input.productionStatus?.toLowerCase() !== 'released') issues.push('tmdb_not_released');
  if (!input.title.trim()) issues.push('missing_title');
  if (!input.releaseDate) issues.push('missing_release_date');
  if (!input.synopsis?.trim()) issues.push('missing_synopsis');
  if (!input.posterUrl?.trim() || /coming soon/i.test(input.posterUrl)) issues.push('missing_poster');
  if (input.genreCount === 0) issues.push('missing_genre');
  if (!input.youtubeTrailerId?.trim() && input.activeYoutubeTrailerCount === 0) issues.push('missing_trailer');
  return issues;
}

export function evaluateLegacyMovieQuality(input: Pick<MovieQualityInput, 'posterUrl' | 'youtubeTrailerId' | 'activeYoutubeTrailerCount'>): MovieQualityIssue[] {
  const issues: MovieQualityIssue[] = [];
  if (!input.posterUrl?.trim() || /coming soon/i.test(input.posterUrl)) issues.push('missing_poster');
  if (!input.youtubeTrailerId?.trim() && input.activeYoutubeTrailerCount === 0) issues.push('missing_trailer');
  return issues;
}

export class ImportQualityService {
  static async evaluate(movieId: string, db: DbClient = prisma) {
    const movie = await db.movie.findUniqueOrThrow({
      where: { id: movieId },
      select: {
        title: true,
        releaseDate: true,
        synopsis: true,
        posterUrl: true,
        productionStatus: true,
        youtubeTrailerId: true,
        _count: { select: { genres: true } },
        trailers: {
          where: { status: TrailerStatus.ACTIVE, sourceType: TrailerSource.YOUTUBE },
          select: { id: true },
          take: 1,
        },
      },
    });

    const issues = evaluateMovieQuality({
      ...movie,
      genreCount: movie._count.genres,
      activeYoutubeTrailerCount: movie.trailers.length,
    });

    const ready = issues.length === 0;
    await db.movie.update({
      where: { id: movieId },
      data: {
        status: ready ? MovieStatus.PUBLISHED : MovieStatus.DRAFT,
        importQualityStatus: ready ? MovieQualityStatus.READY : MovieQualityStatus.INCOMPLETE,
        importQualityIssues: issues,
      },
    });

    return { ready, issues };
  }

  static async evaluateLegacy(movieId: string, db: DbClient = prisma) {
    const movie = await db.movie.findUniqueOrThrow({
      where: { id: movieId },
      select: {
        posterUrl: true,
        youtubeTrailerId: true,
        trailers: {
          where: { status: TrailerStatus.ACTIVE, sourceType: TrailerSource.YOUTUBE },
          select: { id: true },
          take: 1,
        },
      },
    });
    const issues = evaluateLegacyMovieQuality({
      ...movie,
      activeYoutubeTrailerCount: movie.trailers.length,
    });
    const ready = issues.length === 0;
    await db.movie.update({
      where: { id: movieId },
      data: {
        status: ready ? MovieStatus.PUBLISHED : MovieStatus.DRAFT,
        importQualityStatus: ready ? MovieQualityStatus.READY : MovieQualityStatus.INCOMPLETE,
        importQualityIssues: issues,
      },
    });
    return { ready, issues };
  }

  static async refreshLegacyBatch(take = 250, db: DbClient = prisma) {
    const movies = await db.movie.findMany({
      where: {
        status: MovieStatus.PUBLISHED,
        deletedAt: null,
        importQualityStatus: MovieQualityStatus.NEEDS_REVIEW,
      },
      select: {
        id: true,
        posterUrl: true,
        youtubeTrailerId: true,
        trailers: {
          where: { status: TrailerStatus.ACTIVE, sourceType: TrailerSource.YOUTUBE },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { id: 'asc' },
      take,
    });

    const grouped = new Map<string, { issues: MovieQualityIssue[]; ids: string[] }>();
    for (const movie of movies) {
      const issues = evaluateLegacyMovieQuality({ ...movie, activeYoutubeTrailerCount: movie.trailers.length });
      const key = issues.join(',') || 'ready';
      const group = grouped.get(key) || { issues, ids: [] };
      group.ids.push(movie.id);
      grouped.set(key, group);
    }

    let unpublished = 0;
    for (const group of grouped.values()) {
      const incomplete = group.issues.length > 0;
      await db.movie.updateMany({
        where: { id: { in: group.ids } },
        data: {
          status: incomplete ? MovieStatus.DRAFT : MovieStatus.PUBLISHED,
          importQualityStatus: incomplete ? MovieQualityStatus.INCOMPLETE : MovieQualityStatus.READY,
          importQualityIssues: group.issues,
        },
      });
      if (incomplete) unpublished += group.ids.length;
    }

    return { processed: movies.length, unpublished, remaining: movies.length === take };
  }
}
