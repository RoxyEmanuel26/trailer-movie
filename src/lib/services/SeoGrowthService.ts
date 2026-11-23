import { MovieStatus, Prisma, TrailerSource, TrailerStatus } from '@prisma/client';
import { prisma } from '../prisma';
import type { DbClient } from '../repositories/base.types';
import {
  evaluateMovieQuality,
  ImportQualityService,
  UPCOMING_WINDOW_DAYS,
} from './ImportQualityService';
import { moviePath } from '../public-routes';
import { absoluteUrl } from '../site-config';
import { coreIndexNowPaths, submitIndexNowUrls } from '../indexnow';
import { clearAllPublicMemoryCaches } from '../memory-cache';

const MIN_FRANCHISE_PUBLISHED_MOVIES = 2;
const MIN_FRANCHISE_MAX_VOTE_COUNT = 200;

interface QualifyingFranchiseRow {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  coverImageUrl: string | null;
  backdropUrl: string | null;
  posterUrl: string | null;
  movieCount: number;
  maxVotes: number;
  fallbackCover: string | null;
}

export interface UpcomingPromotionResult {
  scannedDrafts: number;
  qualifyingCount: number;
  promotedCount: number;
  promotedPaths: string[];
  topTitles: Array<{ title: string; slug: string; releaseDate: string | null }>;
}

export interface FranchiseActivationResult {
  qualifyingCount: number;
  updatedCount: number;
  updatedPaths: string[];
  topTitles: Array<{ title: string; slug: string; movieCount: number }>;
}

export interface DailySeoMaintenanceResult {
  mode: 'dry-run' | 'apply';
  executedAt: string;
  upcoming: UpcomingPromotionResult;
  franchises: FranchiseActivationResult;
  indexNow: { submitted: number; ok: boolean };
  sitemapRefreshTriggered: boolean;
}

export class SeoGrowthService {
  static async publishReadyUpcomingTrailers(
    options: { dryRun?: boolean; db?: DbClient; now?: Date } = {},
  ): Promise<UpcomingPromotionResult> {
    const dryRun = options.dryRun ?? true;
    const db = options.db ?? prisma;
    const now = options.now ?? new Date();
    const maxUpcomingDate = new Date(now.getTime() + UPCOMING_WINDOW_DAYS * 86_400_000);

    const candidates = await db.movie.findMany({
      where: {
        deletedAt: null,
        status: MovieStatus.DRAFT,
        releaseDate: {
          gt: now,
          lte: maxUpcomingDate,
        },
        productionStatus: {
          in: ['Post Production', 'In Production', 'Planned'],
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        releaseDate: true,
        synopsis: true,
        posterUrl: true,
        productionStatus: true,
        youtubeTrailerId: true,
        popularity: true,
        lockedFields: true,
        _count: { select: { genres: true } },
        trailers: {
          where: { status: TrailerStatus.ACTIVE, sourceType: TrailerSource.YOUTUBE },
          select: { sourceId: true },
          take: 1,
        },
      },
      orderBy: [{ popularity: 'desc' }, { releaseDate: 'asc' }],
    });

    const qualifying = candidates.filter((movie) => {
      const locked = Array.isArray(movie.lockedFields) ? movie.lockedFields : [];
      if (locked.includes('status')) return false;
      const issues = evaluateMovieQuality(
        {
          title: movie.title,
          releaseDate: movie.releaseDate,
          synopsis: movie.synopsis,
          posterUrl: movie.posterUrl,
          productionStatus: movie.productionStatus,
          youtubeTrailerId: movie.youtubeTrailerId,
          genreCount: movie._count.genres,
          activeYoutubeTrailerCount: movie.trailers.length,
        },
        now,
      );
      return issues.length === 0;
    });

    const topTitles = qualifying.slice(0, 10).map((m) => ({
      title: m.title,
      slug: m.slug,
      releaseDate: m.releaseDate ? m.releaseDate.toISOString().slice(0, 10) : null,
    }));

    if (dryRun || qualifying.length === 0) {
      return {
        scannedDrafts: candidates.length,
        qualifyingCount: qualifying.length,
        promotedCount: 0,
        promotedPaths: [],
        topTitles,
      };
    }

    const promotedPaths: string[] = [];
    for (const movie of qualifying) {
      const res = await ImportQualityService.evaluate(movie.id, db);
      if (res.ready) {
        promotedPaths.push(moviePath(movie.slug));
      }
    }

    return {
      scannedDrafts: candidates.length,
      qualifyingCount: qualifying.length,
      promotedCount: promotedPaths.length,
      promotedPaths,
      topTitles,
    };
  }

  static async activateQualifyingFranchises(
    options: { dryRun?: boolean; db?: DbClient } = {},
  ): Promise<FranchiseActivationResult> {
    const dryRun = options.dryRun ?? true;
    const db = options.db ?? prisma;

    const qualifying = await db.$queryRaw<QualifyingFranchiseRow[]>(Prisma.sql`
      WITH ranked_movies AS (
        SELECT
          cm."collectionId",
          m."id" AS "movieId",
          COALESCE(m."voteCount", 0)::int AS "voteCount",
          COALESCE(m."popularity", 0) AS "popularity",
          COALESCE(m."backdropUrl", m."posterUrl") AS "artUrl",
          ROW_NUMBER() OVER (
            PARTITION BY cm."collectionId"
            ORDER BY COALESCE(m."popularity", 0) DESC, COALESCE(m."voteCount", 0) DESC, m."id" ASC
          ) AS rn
        FROM "collection_movies" cm
        JOIN "movies" m ON m."id" = cm."movieId"
        WHERE m."status" = 'PUBLISHED' AND m."deletedAt" IS NULL
      )
      SELECT
        c."id",
        c."title",
        c."slug",
        c."isActive",
        c."coverImageUrl",
        c."backdropUrl",
        c."posterUrl",
        COUNT(DISTINCT rm."movieId")::int AS "movieCount",
        MAX(rm."voteCount")::int AS "maxVotes",
        MAX(CASE WHEN rm.rn = 1 THEN rm."artUrl" END) AS "fallbackCover"
      FROM "collections" c
      JOIN ranked_movies rm ON rm."collectionId" = c."id"
      WHERE BTRIM(c."slug") <> ''
      GROUP BY c."id", c."title", c."slug", c."isActive", c."coverImageUrl", c."backdropUrl", c."posterUrl"
      HAVING COUNT(DISTINCT rm."movieId") >= ${MIN_FRANCHISE_PUBLISHED_MOVIES}
         AND MAX(rm."voteCount") >= ${MIN_FRANCHISE_MAX_VOTE_COUNT}
      ORDER BY MAX(rm."voteCount") DESC, COUNT(DISTINCT rm."movieId") DESC
    `);

    const toUpdate = qualifying.filter((item) => {
      const needsActivate = !item.isActive;
      const needsCover = !item.coverImageUrl && Boolean(item.backdropUrl || item.posterUrl || item.fallbackCover);
      return needsActivate || needsCover;
    });

    const topTitles = toUpdate.slice(0, 10).map((item) => ({
      title: item.title,
      slug: item.slug,
      movieCount: item.movieCount,
    }));

    if (dryRun || toUpdate.length === 0) {
      return {
        qualifyingCount: qualifying.length,
        updatedCount: 0,
        updatedPaths: [],
        topTitles,
      };
    }

    const updatedPaths: string[] = [];
    for (const item of toUpdate) {
      const resolvedCover =
        item.coverImageUrl || item.backdropUrl || item.posterUrl || item.fallbackCover || null;
      await db.collection.update({
        where: { id: item.id },
        data: {
          isActive: true,
          ...(resolvedCover && !item.coverImageUrl ? { coverImageUrl: resolvedCover } : {}),
        },
      });
      updatedPaths.push(`/collection/${item.slug}`);
    }

    return {
      qualifyingCount: qualifying.length,
      updatedCount: updatedPaths.length,
      updatedPaths,
      topTitles,
    };
  }

  static async runDailyMaintenance(
    options: { dryRun?: boolean; submitIndexNow?: boolean; db?: DbClient } = {},
  ): Promise<DailySeoMaintenanceResult> {
    const dryRun = options.dryRun ?? true;
    const db = options.db ?? prisma;

    // Run sequentially so maintenance never consumes more than 1 DB pool slot.
    const upcoming = await this.publishReadyUpcomingTrailers({ dryRun, db });
    const franchises = await this.activateQualifyingFranchises({ dryRun, db });

    const mutatingCount = upcoming.promotedCount + franchises.updatedCount;
    let indexNow = { submitted: 0, ok: false };
    let sitemapRefreshTriggered = false;

    if (!dryRun) {
      if (mutatingCount > 0) {
        clearAllPublicMemoryCaches();
        const trigger = (globalThis as { __movieflixTriggerSitemapRefresh?: () => void })
          .__movieflixTriggerSitemapRefresh;
        if (typeof trigger === 'function') {
          trigger();
          sitemapRefreshTriggered = true;
        }
      }

      if (options.submitIndexNow !== false) {
        const urlsToSubmit = [
          ...coreIndexNowPaths(),
          ...upcoming.promotedPaths.slice(0, 300).map((p) => absoluteUrl(p)),
          ...franchises.updatedPaths.slice(0, 100).map((p) => absoluteUrl(p)),
        ];
        indexNow = await submitIndexNowUrls(urlsToSubmit);
      }
    }

    return {
      mode: dryRun ? 'dry-run' : 'apply',
      executedAt: new Date().toISOString(),
      upcoming,
      franchises,
      indexNow,
      sitemapRefreshTriggered,
    };
  }
}
