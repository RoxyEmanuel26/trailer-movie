import { prisma } from '@/lib/prisma';
import { ImageType, ProviderAccessType, DataSource, PersonRoleType, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export interface EnrichmentResult {
  movieId: string;
  tmdbId: number;
  imagesCount: number;
  altTitlesCount: number;
  watchProvidersCount: number;
  reviewsCount: number;
  recommendationsCount: number;
  peopleUpdatedCount: number;
}

export class EnrichmentService {
  /**
   * Enriches a single movie in our local database with complete TMDB metadata.
   * This is 100% additive and safe.
   */
  static async enrichMovie(
    movieId: string,
    tmdbData: any,
    client: Prisma.TransactionClient | typeof prisma = prisma
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
    };

    // 1. Extract Logo URL from images if present
    let logoUrl: string | null = null;
    if (tmdbData.images?.logos && Array.isArray(tmdbData.images.logos) && tmdbData.images.logos.length > 0) {
      const enLogo = tmdbData.images.logos.find((l: any) => l.iso_639_1 === 'en') || tmdbData.images.logos[0];
      if (enLogo?.file_path) {
        logoUrl = `https://image.tmdb.org/t/p/original${enLogo.file_path}`;
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

    // Watch providers JSON fallback
    if (tmdbData['watch/providers']?.results) {
      const usOrId = tmdbData['watch/providers'].results.US || tmdbData['watch/providers'].results.ID || null;
      if (usOrId) {
        movieUpdateData.watchProviders = usOrId;
      }
    }

    // Reviews JSON fallback
    if (tmdbData.reviews?.results) {
      movieUpdateData.reviews = tmdbData.reviews.results;
    }

    await client.movie.update({
      where: { id: movieId },
      data: movieUpdateData,
    });

    // 3. Populate MovieImage (Posters, Backdrops, Logos)
    if (tmdbData.images) {
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
              imageUrl: `https://image.tmdb.org/t/p/original${img.file_path}`,
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
              imageUrl: `https://image.tmdb.org/t/p/original${img.file_path}`,
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
              imageUrl: `https://image.tmdb.org/t/p/original${img.file_path}`,
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

      if (imagesToInsert.length > 0) {
        await client.movieImage.deleteMany({ where: { movieId } });
        await client.movieImage.createMany({
          data: imagesToInsert,
          skipDuplicates: true,
        });
        result.imagesCount = imagesToInsert.length;
      }
    }

    // 4. Populate MovieAlternativeTitle
    if (tmdbData.alternative_titles?.titles && Array.isArray(tmdbData.alternative_titles.titles)) {
      const titles = tmdbData.alternative_titles.titles.slice(0, 30);
      if (titles.length > 0) {
        await client.movieAlternativeTitle.deleteMany({ where: { movieId } });
        const altTitlesToInsert: Prisma.MovieAlternativeTitleCreateManyInput[] = titles.map((t: any) => ({
          movieId,
          title: String(t.title).slice(0, 500),
          countryCode: t.iso_3166_1 || null,
          type: t.type || null,
        }));

        await client.movieAlternativeTitle.createMany({
          data: altTitlesToInsert,
          skipDuplicates: true,
        });
        result.altTitlesCount = altTitlesToInsert.length;
      }
    }

    // 5. Populate Watch Providers & Links
    if (tmdbData['watch/providers']?.results) {
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
                providerLogo: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
                priority: p.display_priority ?? 0,
                countryCode: cCode,
                accessType: type,
                linkUrl: pageLink,
              });
            }
          }
        }
      }

      if (linksToInsert.length > 0) {
        // Upsert unique watch providers first
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

        // Clean existing links for this movie and re-insert
        await client.movieWatchProviderLink.deleteMany({ where: { movieId } });

        const formattedLinks: Prisma.MovieWatchProviderLinkCreateManyInput[] = [];
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

        if (formattedLinks.length > 0) {
          await client.movieWatchProviderLink.createMany({
            data: formattedLinks,
            skipDuplicates: true,
          });
          result.watchProvidersCount = formattedLinks.length;
        }
      }
    }

    // 6. Populate MovieReview
    if (tmdbData.reviews?.results && Array.isArray(tmdbData.reviews.results)) {
      const reviews = tmdbData.reviews.results.slice(0, 10);
      if (reviews.length > 0) {
        await client.movieReview.deleteMany({ where: { movieId } });
        const reviewsToInsert: Prisma.MovieReviewCreateManyInput[] = reviews.map((r: any) => {
          let avatar = r.author_details?.avatar_path || null;
          if (avatar && !avatar.startsWith('http')) {
            avatar = `https://image.tmdb.org/t/p/w200${avatar}`;
          }
          return {
            movieId,
            tmdbId: r.id ? String(r.id) : null,
            author: String(r.author || 'Anonymous').slice(0, 255),
            authorUsername: r.author_details?.username ? String(r.author_details.username).slice(0, 255) : null,
            authorAvatar: avatar,
            content: r.content || '',
            rating: typeof r.author_details?.rating === 'number' ? r.author_details.rating : null,
            url: r.url || null,
            source: DataSource.TMDB,
          };
        });

        await client.movieReview.createMany({
          data: reviewsToInsert,
          skipDuplicates: true,
        });
        result.reviewsCount = reviewsToInsert.length;
      }
    }

    // 7. Populate MovieRecommendation
    if (tmdbData.recommendations?.results && Array.isArray(tmdbData.recommendations.results)) {
      const recs = tmdbData.recommendations.results.slice(0, 20);
      const recTmdbIds = recs.map((r: any) => r.id).filter((id: any) => typeof id === 'number');

      if (recTmdbIds.length > 0) {
        // Find which recommended movies already exist in our local database
        const matchingTargetMovies = await client.movie.findMany({
          where: { tmdbId: { in: recTmdbIds } },
          select: { id: true, tmdbId: true },
        });

        if (matchingTargetMovies.length > 0) {
          const tmdbToTargetId = new Map<number, string>();
          for (const m of matchingTargetMovies) {
            if (m.tmdbId) tmdbToTargetId.set(m.tmdbId, m.id);
          }

          await client.movieRecommendation.deleteMany({ where: { sourceMovieId: movieId } });

          const recsToInsert: Prisma.MovieRecommendationCreateManyInput[] = [];
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

          if (recsToInsert.length > 0) {
            await client.movieRecommendation.createMany({
              data: recsToInsert,
              skipDuplicates: true,
            });
            result.recommendationsCount = recsToInsert.length;
          }
        }
      }
    }

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
