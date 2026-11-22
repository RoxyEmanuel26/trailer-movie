import { prisma } from '@/lib/prisma';
import { ImageType, ProviderAccessType, DataSource, Prisma } from '@prisma/client';

function normalizeTmdbReviewAvatar(avatarPath: unknown): string | null {
  if (typeof avatarPath !== 'string') return null;
  const trimmed = avatarPath.trim();
  if (!trimmed) return null;
  // TMDB sometimes prepends "/" to external Gravatar URLs ("/https://www.gravatar.com/...").
  // Reject any external or protocol-bearing URL so we never store malformed URLs or violate CSP.
  if (/^\/?https?:\/\//i.test(trimmed) || !trimmed.startsWith('/')) {
    return null;
  }
  return `https://image.tmdb.org/t/p/w200${trimmed}`;
}

export interface EnrichmentResult {
  movieId: string;
  tmdbId: number;
  imagesCount: number;
  altTitlesCount: number;
  watchProvidersCount: number;
  reviewsCount: number;
  recommendationsCount: number;
  peopleUpdatedCount: number;
  issues: string[];
}

export class EnrichmentService {
  /**
   * Enriches a single movie in our local database with complete TMDB metadata.
   * This is 100% additive and safe.
   */
  static async enrichMovie(
    movieId: string,
    tmdbData: any,
    client: Prisma.TransactionClient | typeof prisma = prisma,
    lockedFields: string[] = []
  ): Promise<EnrichmentResult> {
    const tmdbId = tmdbData.id;
    const result: EnrichmentResult = {
      movieId,
      tmdbId,
      imagesCount: 0,
      altTitlesCount: 0,
      watchProvidersCount: 0,
      reviewsCount: 0,
      recommendationsCount: 0,
      peopleUpdatedCount: 0,
      issues: [],
    };

    // 1. Extract Logo URL from images if present
    let logoUrl: string | null = null;
    if (tmdbData.images?.logos && Array.isArray(tmdbData.images.logos) && tmdbData.images.logos.length > 0) {
      const enLogo = tmdbData.images.logos.find((l: any) => l.iso_639_1 === 'en') || tmdbData.images.logos[0];
      if (enLogo?.file_path) {
        logoUrl = `https://image.tmdb.org/t/p/w500${enLogo.file_path}`;
      }
    }

    // 2. Update Movie core enriched columns
    const movieUpdateData: Prisma.MovieUpdateInput = {
      voteAverage: typeof tmdbData.vote_average === 'number' ? tmdbData.vote_average : undefined,
      voteCount: typeof tmdbData.vote_count === 'number' ? tmdbData.vote_count : undefined,
      popularity: typeof tmdbData.popularity === 'number' ? tmdbData.popularity : undefined,
      tagline: tmdbData.tagline || undefined,
      originalLanguage: tmdbData.original_language || undefined,
      imdbId: tmdbData.imdb_id || undefined,
      homepage: tmdbData.homepage || undefined,
      productionStatus: tmdbData.status || undefined,
      adult: typeof tmdbData.adult === 'boolean' ? tmdbData.adult : false,
    };

    if (logoUrl) {
      movieUpdateData.logoUrl = logoUrl;
    }

    // Also populate legacy JSON fields if they are missing in the movie
    if (tmdbData.budget && tmdbData.budget > 0) {
      movieUpdateData.budget = BigInt(tmdbData.budget);
    }
    if (tmdbData.revenue && tmdbData.revenue > 0) {
      movieUpdateData.revenue = BigInt(tmdbData.revenue);
    }

    // Release date certification (age rating)
    if (tmdbData.release_dates?.results) {
      const usRelease = tmdbData.release_dates.results.find((r: any) => r.iso_3166_1 === 'US');
      if (usRelease?.release_dates?.length > 0) {
        const cert = usRelease.release_dates.find((r: any) => r.certification !== '');
        if (cert?.certification) {
          movieUpdateData.ageRating = cert.certification;
          movieUpdateData.mpaaRating = cert.certification;
        }
      }
    }

    const isWatchProvidersLocked =
      lockedFields.includes('watchProviders') || lockedFields.includes('watch_providers');

    // Watch providers JSON fallback
    if (!isWatchProvidersLocked && tmdbData['watch/providers']?.results) {
      const usOrId = tmdbData['watch/providers'].results.US || tmdbData['watch/providers'].results.ID || null;
      if (usOrId) {
        movieUpdateData.watchProviders = usOrId;
      }
    }

    // Reviews JSON fallback
    if (!lockedFields.includes('reviews') && tmdbData.reviews?.results) {
      movieUpdateData.reviews = tmdbData.reviews.results;
    }

    for (const field of lockedFields) {
      delete (movieUpdateData as Record<string, unknown>)[field];
    }

    await client.movie.update({
      where: { id: movieId },
      data: movieUpdateData,
    });

    // Helper to execute child deleteMany+createMany atomically when using root PrismaClient
    const runAtomic = async <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> => {
      if (client === prisma) {
        return prisma.$transaction(fn, { maxWait: 10_000, timeout: 30_000 });
      }
      return fn(client as Prisma.TransactionClient);
    };

    // 3. Populate MovieImage (Posters, Backdrops, Logos)
    if (!lockedFields.includes('images') && tmdbData.images) {
      const imagesToInsert: Prisma.MovieImageCreateManyInput[] = [];

      // Top Backdrops (up to 8)
      if (Array.isArray(tmdbData.images.backdrops)) {
        const sortedBackdrops = [...tmdbData.images.backdrops]
          .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
          .slice(0, 8);

        sortedBackdrops.forEach((img, idx) => {
          if (img.file_path) {
            imagesToInsert.push({
              movieId,
              imageUrl: `https://image.tmdb.org/t/p/w1280${img.file_path}`,
              imageType: ImageType.BACKDROP,
              aspectRatio: img.aspect_ratio || null,
              width: img.width || null,
              height: img.height || null,
              isoCode: img.iso_639_1 || null,
              voteAverage: img.vote_average || null,
              voteCount: img.vote_count || null,
              sortOrder: idx,
            });
          }
        });
      }

      // Top Posters (up to 8)
      if (Array.isArray(tmdbData.images.posters)) {
        const sortedPosters = [...tmdbData.images.posters]
          .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
          .slice(0, 8);

        sortedPosters.forEach((img, idx) => {
          if (img.file_path) {
            imagesToInsert.push({
              movieId,
              imageUrl: `https://image.tmdb.org/t/p/w500${img.file_path}`,
              imageType: ImageType.POSTER,
              aspectRatio: img.aspect_ratio || null,
              width: img.width || null,
              height: img.height || null,
              isoCode: img.iso_639_1 || null,
              voteAverage: img.vote_average || null,
              voteCount: img.vote_count || null,
              sortOrder: idx,
            });
          }
        });
      }

      // Top Logos (up to 5)
      if (Array.isArray(tmdbData.images.logos)) {
        const sortedLogos = [...tmdbData.images.logos]
          .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
          .slice(0, 5);

        sortedLogos.forEach((img, idx) => {
          if (img.file_path) {
            imagesToInsert.push({
              movieId,
              imageUrl: `https://image.tmdb.org/t/p/w500${img.file_path}`,
              imageType: ImageType.LOGO,
              aspectRatio: img.aspect_ratio || null,
              width: img.width || null,
              height: img.height || null,
              isoCode: img.iso_639_1 || null,
              voteAverage: img.vote_average || null,
              voteCount: img.vote_count || null,
              sortOrder: idx,
            });
          }
        });
      }

      await runAtomic(async (tx) => {
        await tx.movieImage.deleteMany({ where: { movieId } });
        if (imagesToInsert.length > 0) {
          await tx.movieImage.createMany({
            data: imagesToInsert,
            skipDuplicates: true,
          });
          result.imagesCount = imagesToInsert.length;
        }
      });
    } else if (!lockedFields.includes('images')) result.issues.push('images_unavailable');

    // 4. Populate MovieAlternativeTitle
    if (!lockedFields.includes('alternative_titles') && tmdbData.alternative_titles?.titles && Array.isArray(tmdbData.alternative_titles.titles)) {
      const titles = tmdbData.alternative_titles.titles.slice(0, 30);
      await runAtomic(async (tx) => {
        await tx.movieAlternativeTitle.deleteMany({ where: { movieId } });
        if (titles.length > 0) {
          const altTitlesToInsert: Prisma.MovieAlternativeTitleCreateManyInput[] = titles.map((t: any) => ({
            movieId,
            title: String(t.title).slice(0, 500),
            countryCode: t.iso_3166_1 || null,
            type: t.type || null,
          }));

          await tx.movieAlternativeTitle.createMany({
            data: altTitlesToInsert,
            skipDuplicates: true,
          });
          result.altTitlesCount = altTitlesToInsert.length;
        }
      });
    } else if (!lockedFields.includes('alternative_titles')) result.issues.push('alternative_titles_unavailable');

    // 5. Populate Watch Providers & Links
    if (!isWatchProvidersLocked && tmdbData['watch/providers']?.results) {
      const providerResults = tmdbData['watch/providers'].results;
      // Extract target countries: US, ID, and others if available
      const countriesToCheck = Object.keys(providerResults);
      const linksToInsert: {
        providerTmdbId: number;
        providerName: string;
        providerLogo: string | null;
        priority: number;
        countryCode: string;
        accessType: ProviderAccessType;
        linkUrl: string | null;
      }[] = [];

      for (const cCode of countriesToCheck) {
        const countryData = providerResults[cCode];
        if (!countryData) continue;
        const pageLink = countryData.link || null;

        const accessTypes: { type: ProviderAccessType; key: string }[] = [
          { type: ProviderAccessType.FLATRATE, key: 'flatrate' },
          { type: ProviderAccessType.RENT, key: 'rent' },
          { type: ProviderAccessType.BUY, key: 'buy' },
          { type: ProviderAccessType.FREE, key: 'free' },
          { type: ProviderAccessType.ADS, key: 'ads' },
        ];

        for (const { type, key } of accessTypes) {
          const list = countryData[key];
          if (Array.isArray(list)) {
            for (const p of list) {
              linksToInsert.push({
                providerTmdbId: p.provider_id,
                providerName: p.provider_name,
                providerLogo: p.logo_path ? `https://image.tmdb.org/t/p/w185${p.logo_path}` : null,
                priority: p.display_priority ?? 0,
                countryCode: cCode,
                accessType: type,
                linkUrl: pageLink,
              });
            }
          }
        }
      }

      const formattedLinks: Prisma.MovieWatchProviderLinkCreateManyInput[] = [];
      if (linksToInsert.length > 0) {
        // Upsert shared watch provider dictionary outside the movie transaction to avoid lock contention
        const uniqueProvidersMap = new Map<number, { name: string; logoUrl: string | null; priority: number }>();
        for (const item of linksToInsert) {
          if (!uniqueProvidersMap.has(item.providerTmdbId)) {
            uniqueProvidersMap.set(item.providerTmdbId, {
              name: item.providerName,
              logoUrl: item.providerLogo,
              priority: item.priority,
            });
          }
        }

        const pTmdbIds = Array.from(uniqueProvidersMap.keys());
        const existingWps = await client.watchProvider.findMany({
          where: { tmdbId: { in: pTmdbIds } },
          select: { id: true, tmdbId: true },
        });
        const existingTmdbIds = new Set(existingWps.map((w) => w.tmdbId));

        const missingToCreate = pTmdbIds
          .filter((id) => !existingTmdbIds.has(id))
          .map((id) => {
            const info = uniqueProvidersMap.get(id)!;
            return {
              tmdbId: id,
              name: info.name,
              logoUrl: info.logoUrl,
              displayPriority: info.priority,
            };
          });

        if (missingToCreate.length > 0) {
          await client.watchProvider.createMany({
            data: missingToCreate,
            skipDuplicates: true,
          });
        }

        const allWps = await client.watchProvider.findMany({
          where: { tmdbId: { in: pTmdbIds } },
          select: { id: true, tmdbId: true },
        });

        const providerDbIdMap = new Map<number, string>();
        for (const wp of allWps) {
          providerDbIdMap.set(wp.tmdbId, wp.id);
        }

        const seenKeys = new Set<string>();
        for (const item of linksToInsert) {
          const providerId = providerDbIdMap.get(item.providerTmdbId);
          if (!providerId) continue;
          const uniqueKey = `${movieId}_${providerId}_${item.countryCode}_${item.accessType}`;
          if (seenKeys.has(uniqueKey)) continue;
          seenKeys.add(uniqueKey);

          formattedLinks.push({
            movieId,
            providerId,
            countryCode: item.countryCode,
            accessType: item.accessType,
            linkUrl: item.linkUrl,
          });
        }
      }

      await runAtomic(async (tx) => {
        await tx.movieWatchProviderLink.deleteMany({ where: { movieId } });
        if (formattedLinks.length > 0) {
          await tx.movieWatchProviderLink.createMany({
            data: formattedLinks,
            skipDuplicates: true,
          });
          result.watchProvidersCount = formattedLinks.length;
        }
      });
    } else if (!isWatchProvidersLocked) result.issues.push('watch_providers_unavailable');

    // 6. Populate MovieReview (preserve MANUAL admin/editor reviews!)
    if (!lockedFields.includes('reviews') && tmdbData.reviews?.results && Array.isArray(tmdbData.reviews.results)) {
      const reviews = tmdbData.reviews.results.slice(0, 10);
      await runAtomic(async (tx) => {
        await tx.movieReview.deleteMany({ where: { movieId, source: DataSource.TMDB } });
        if (reviews.length > 0) {
          const reviewsToInsert: Prisma.MovieReviewCreateManyInput[] = reviews.map((r: any) => ({
            movieId,
            tmdbId: r.id ? String(r.id) : null,
            author: String(r.author || 'Anonymous').slice(0, 255),
            authorUsername: r.author_details?.username ? String(r.author_details.username).slice(0, 255) : null,
            authorAvatar: normalizeTmdbReviewAvatar(r.author_details?.avatar_path),
            content: r.content || '',
            rating: typeof r.author_details?.rating === 'number' ? r.author_details.rating : null,
            url: r.url || null,
            source: DataSource.TMDB,
          }));

          await tx.movieReview.createMany({
            data: reviewsToInsert,
            skipDuplicates: true,
          });
          result.reviewsCount = reviewsToInsert.length;
        }
      });
    } else if (!lockedFields.includes('reviews')) result.issues.push('reviews_unavailable');

    // 7. Populate MovieRecommendation
    if (!lockedFields.includes('recommendations') && tmdbData.recommendations?.results && Array.isArray(tmdbData.recommendations.results)) {
      const recs = tmdbData.recommendations.results.slice(0, 20);
      const recTmdbIds = recs.map((r: any) => r.id).filter((id: any) => typeof id === 'number');
      const recsToInsert: Prisma.MovieRecommendationCreateManyInput[] = [];

      if (recTmdbIds.length > 0) {
        const matchingTargetMovies = await client.movie.findMany({
          where: { tmdbId: { in: recTmdbIds }, deletedAt: null },
          select: { id: true, tmdbId: true },
        });

        const tmdbToTargetId = new Map<number, string>();
        for (const m of matchingTargetMovies) {
          if (m.tmdbId) tmdbToTargetId.set(m.tmdbId, m.id);
        }

        recs.forEach((r: any, idx: number) => {
          const targetId = tmdbToTargetId.get(r.id);
          if (targetId && targetId !== movieId) {
            recsToInsert.push({
              sourceMovieId: movieId,
              targetMovieId: targetId,
              score: typeof r.vote_average === 'number' ? r.vote_average : null,
              sortOrder: idx,
            });
          }
        });
      }

      await runAtomic(async (tx) => {
        await tx.movieRecommendation.deleteMany({ where: { sourceMovieId: movieId } });
        if (recsToInsert.length > 0) {
          await tx.movieRecommendation.createMany({
            data: recsToInsert,
            skipDuplicates: true,
          });
          result.recommendationsCount = recsToInsert.length;
        }
      });
    } else if (!lockedFields.includes('recommendations')) result.issues.push('recommendations_unavailable');

    // 8. Update Popularity & IMDB ID for People if credits are attached
    if (tmdbData.credits?.cast || tmdbData.credits?.crew) {
      const allPeople = [
        ...(tmdbData.credits.cast || []),
        ...(tmdbData.credits.crew || []),
      ];

      const uniquePeople = new Map<number, { popularity?: number }>();
      for (const p of allPeople) {
        if (p.id && typeof p.popularity === 'number') {
          uniquePeople.set(p.id, { popularity: p.popularity });
        }
      }

      if (uniquePeople.size > 0) {
        const pTmdbIds = Array.from(uniquePeople.keys());
        const existingPeopleToUpdate = await client.person.findMany({
          where: {
            tmdbId: { in: pTmdbIds },
            popularity: null,
          },
          select: { id: true, tmdbId: true },
        });

        if (existingPeopleToUpdate.length > 0) {
          await Promise.all(
            existingPeopleToUpdate.map((p) => {
              const info = uniquePeople.get(p.tmdbId!);
              if (!info || info.popularity === undefined) return Promise.resolve();
              return client.person.update({
                where: { id: p.id },
                data: { popularity: info.popularity },
              });
            })
          );
          result.peopleUpdatedCount = existingPeopleToUpdate.length;
        }
      }
    }

    return result;
  }
}
