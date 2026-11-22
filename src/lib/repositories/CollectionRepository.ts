import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export interface ActiveFranchiseSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  backdropUrl: string | null;
  posterUrl: string | null;
  movieCount: number;
  totalRuntimeMinutes: number;
  earliestYear: number | null;
  latestYear: number | null;
  topMoviePosterUrl: string | null;
  topMovieBackdropUrl: string | null;
}

export class CollectionRepository {
  static async findBySlug(slug: string, publicOnly = false, db: DbClient = prisma) {
    return db.collection.findFirst({
      where: publicOnly ? { slug, isActive: true } : { slug },
    });
  }

  static async listActiveFranchiseSummaries(
    params: { skip?: number; take?: number } = {},
    db: DbClient = prisma,
  ): Promise<{ items: ActiveFranchiseSummary[]; total: number }> {
    const skip = Math.max(0, params.skip || 0);
    const take = Math.min(48, Math.max(1, params.take || 24));
    const rows = await db.$queryRaw<
      Array<ActiveFranchiseSummary & { totalCount: bigint }>
    >(Prisma.sql`
      WITH ranked_movies AS (
        SELECT
          cm."collectionId",
          m."id" AS "movieId",
          m."runtimeMinutes",
          m."releaseDate",
          m."popularity",
          m."posterUrl",
          m."backdropUrl",
          ROW_NUMBER() OVER (
            PARTITION BY cm."collectionId"
            ORDER BY COALESCE(m."popularity", 0) DESC, m."releaseDate" DESC NULLS LAST, m."id" ASC
          ) AS rn
        FROM "collection_movies" cm
        JOIN "movies" m ON m."id" = cm."movieId"
        WHERE m."status" = 'PUBLISHED' AND m."deletedAt" IS NULL
      ),
      agg AS (
        SELECT
          c."id",
          c."title",
          c."slug",
          c."description",
          c."coverImageUrl",
          c."backdropUrl",
          c."posterUrl",
          COUNT(DISTINCT rm."movieId")::int AS "movieCount",
          COALESCE(SUM(CASE WHEN rm."runtimeMinutes" > 0 THEN rm."runtimeMinutes" ELSE 0 END), 0)::int AS "totalRuntimeMinutes",
          MIN(EXTRACT(YEAR FROM rm."releaseDate"))::int AS "earliestYear",
          MAX(EXTRACT(YEAR FROM rm."releaseDate"))::int AS "latestYear",
          MAX(CASE WHEN rm.rn = 1 THEN rm."posterUrl" END) AS "topMoviePosterUrl",
          MAX(CASE WHEN rm.rn = 1 THEN rm."backdropUrl" END) AS "topMovieBackdropUrl",
          SUM(COALESCE(rm."popularity", 0)) AS total_pop
        FROM "collections" c
        JOIN ranked_movies rm ON rm."collectionId" = c."id"
        WHERE c."isActive" = true AND BTRIM(c."slug") <> ''
        GROUP BY c."id", c."title", c."slug", c."description", c."coverImageUrl", c."backdropUrl", c."posterUrl"
        HAVING COUNT(DISTINCT rm."movieId") >= 2
      )
      SELECT
        "id",
        "title",
        "slug",
        "description",
        "coverImageUrl",
        "backdropUrl",
        "posterUrl",
        "movieCount",
        "totalRuntimeMinutes",
        "earliestYear",
        "latestYear",
        "topMoviePosterUrl",
        "topMovieBackdropUrl",
        COUNT(*) OVER ()::bigint AS "totalCount"
      FROM agg
      ORDER BY total_pop DESC, "movieCount" DESC, "title" ASC
      OFFSET ${skip}
      LIMIT ${take}
    `);

    const total = rows.length > 0 ? Number(rows[0].totalCount) : 0;
    const items: ActiveFranchiseSummary[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      coverImageUrl: row.coverImageUrl,
      backdropUrl: row.backdropUrl,
      posterUrl: row.posterUrl,
      movieCount: Number(row.movieCount),
      totalRuntimeMinutes: Number(row.totalRuntimeMinutes),
      earliestYear: row.earliestYear ? Number(row.earliestYear) : null,
      latestYear: row.latestYear ? Number(row.latestYear) : null,
      topMoviePosterUrl: row.topMoviePosterUrl,
      topMovieBackdropUrl: row.topMovieBackdropUrl,
    }));

    return { items, total };
  }

  static async listActive(db: DbClient = prisma) {
    return db.collection.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    });
  }

  static async listAll(db: DbClient = prisma) {
    return db.collection.findMany({
      orderBy: { title: 'asc' },
    });
  }

  static async findById(id: string, publicOnly = false, db: DbClient = prisma) {
    const movieWhere = publicOnly
      ? { status: 'PUBLISHED' as const, deletedAt: null }
      : { deletedAt: null };
    return db.collection.findFirst({
      where: publicOnly ? { id, isActive: true } : { id },
      include: {
        movies: {
          where: { movie: movieWhere },
          include: { movie: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  static async create(data: Prisma.CollectionCreateInput, db: DbClient = prisma) {
    return db.collection.create({ data });
  }

  static async update(id: string, data: Prisma.CollectionUpdateInput, db: DbClient = prisma) {
    return db.collection.update({ where: { id }, data });
  }

  static async delete(id: string, db: DbClient = prisma) {
    return db.collection.delete({ where: { id } });
  }

  static async deleteMany(ids: string[], db: DbClient = prisma) {
    return db.collection.deleteMany({
      where: { id: { in: ids } },
    });
  }

  static async updateStatus(ids: string[], isActive: boolean, db: DbClient = prisma) {
    return db.collection.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });
  }

  static async updateFeatured(ids: string[], isFeatured: boolean, db: DbClient = prisma) {
    return db.collection.updateMany({
      where: { id: { in: ids } },
      data: { isFeatured },
    });
  }

  // Movie assignments
  static async replaceMovies(collectionId: string, movieIds: string[], db: DbClient = prisma) {
    // If db is already a transaction client, we just execute on it.
    // In Prisma, nested transactions require the interactive transaction client ($transaction).
    // To be safe, if `db` has `$transaction`, use it. Otherwise, assume it's already inside one.
    const run = async (tx: any) => {
      await tx.collectionMovie.deleteMany({ where: { collectionId } });
      
      const uniqueMovieIds = [...new Set(movieIds.filter(Boolean))];
      if (uniqueMovieIds.length > 0) {
        const createData = uniqueMovieIds.map((movieId, index) => ({
          collectionId,
          movieId,
          sortOrder: index,
        }));
        await tx.collectionMovie.createMany({ data: createData, skipDuplicates: true });
      }
      return tx.collection.findUnique({
        where: { id: collectionId },
        include: {
          movies: {
            where: { movie: { deletedAt: null } },
            include: { movie: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    };

    if ('$transaction' in db) {
      return (db as any).$transaction(run);
    }
    
    return run(db);
  }
}
