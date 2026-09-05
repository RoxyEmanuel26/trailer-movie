-- =============================================================================
-- Migration Script: TMDB Extended Catalog Schema (Fase 1)
-- Sifat: 100% Additive, Non-destructive, Zero Data Loss
-- =============================================================================

-- 1. Create Enums
CREATE TYPE "ImageType" AS ENUM ('BACKDROP', 'POSTER', 'LOGO');
CREATE TYPE "ProviderAccessType" AS ENUM ('FLATRATE', 'RENT', 'BUY', 'FREE', 'ADS');

-- 2. Alter Existing Enums (Append-Only)
ALTER TYPE "PersonRoleType" ADD VALUE 'COMPOSER';
ALTER TYPE "PersonRoleType" ADD VALUE 'CINEMATOGRAPHER';
ALTER TYPE "PersonRoleType" ADD VALUE 'EDITOR';

ALTER TYPE "TrailerType" ADD VALUE 'BEHIND_THE_SCENES';
ALTER TYPE "TrailerType" ADD VALUE 'BLOOPERS';

-- 3. Add Columns to Existing Tables (Nullable or Safe Default)
ALTER TABLE "movies" 
  ADD COLUMN "adult" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "homepage" TEXT,
  ADD COLUMN "imdbId" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "originalLanguage" TEXT,
  ADD COLUMN "popularity" DOUBLE PRECISION,
  ADD COLUMN "productionStatus" TEXT,
  ADD COLUMN "tagline" TEXT,
  ADD COLUMN "voteAverage" DOUBLE PRECISION,
  ADD COLUMN "voteCount" INTEGER;

ALTER TABLE "people" 
  ADD COLUMN "imdbId" TEXT,
  ADD COLUMN "popularity" DOUBLE PRECISION;

-- 4. Create New Tables
CREATE TABLE "movie_recommendations" (
    "id" TEXT NOT NULL,
    "sourceMovieId" TEXT NOT NULL,
    "targetMovieId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movie_images" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageType" "ImageType" NOT NULL DEFAULT 'POSTER',
    "aspectRatio" DOUBLE PRECISION,
    "width" INTEGER,
    "height" INTEGER,
    "isoCode" TEXT,
    "voteAverage" DOUBLE PRECISION,
    "voteCount" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movie_alternative_titles" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "countryCode" TEXT,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_alternative_titles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "watch_providers" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "displayPriority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movie_watch_provider_links" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'US',
    "accessType" "ProviderAccessType" NOT NULL DEFAULT 'FLATRATE',
    "linkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_watch_provider_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movie_reviews" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "tmdbId" TEXT,
    "author" TEXT NOT NULL,
    "authorUsername" TEXT,
    "authorAvatar" TEXT,
    "content" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "url" TEXT,
    "source" "DataSource" NOT NULL DEFAULT 'TMDB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movie_reviews_pkey" PRIMARY KEY ("id")
);

-- 5. Create Indices
CREATE INDEX "movie_recommendations_sourceMovieId_idx" ON "movie_recommendations"("sourceMovieId");
CREATE INDEX "movie_recommendations_targetMovieId_idx" ON "movie_recommendations"("targetMovieId");
CREATE UNIQUE INDEX "movie_recommendations_sourceMovieId_targetMovieId_key" ON "movie_recommendations"("sourceMovieId", "targetMovieId");

CREATE INDEX "movie_images_movieId_imageType_idx" ON "movie_images"("movieId", "imageType");

CREATE INDEX "movie_alternative_titles_movieId_idx" ON "movie_alternative_titles"("movieId");
CREATE INDEX "movie_alternative_titles_title_idx" ON "movie_alternative_titles"("title");

CREATE UNIQUE INDEX "watch_providers_tmdbId_key" ON "watch_providers"("tmdbId");

CREATE INDEX "movie_watch_provider_links_movieId_idx" ON "movie_watch_provider_links"("movieId");
CREATE INDEX "movie_watch_provider_links_providerId_idx" ON "movie_watch_provider_links"("providerId");
CREATE UNIQUE INDEX "movie_watch_provider_links_movieId_providerId_countryCode_a_key" ON "movie_watch_provider_links"("movieId", "providerId", "countryCode", "accessType");

CREATE UNIQUE INDEX "movie_reviews_tmdbId_key" ON "movie_reviews"("tmdbId");
CREATE INDEX "movie_reviews_movieId_idx" ON "movie_reviews"("movieId");

CREATE INDEX "movies_popularity_idx" ON "movies"("popularity");
CREATE INDEX "movies_voteAverage_idx" ON "movies"("voteAverage");
CREATE INDEX "people_popularity_idx" ON "people"("popularity");

-- 6. Add Foreign Keys
ALTER TABLE "movie_recommendations" ADD CONSTRAINT "movie_recommendations_sourceMovieId_fkey" FOREIGN KEY ("sourceMovieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "movie_recommendations" ADD CONSTRAINT "movie_recommendations_targetMovieId_fkey" FOREIGN KEY ("targetMovieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "movie_images" ADD CONSTRAINT "movie_images_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "movie_alternative_titles" ADD CONSTRAINT "movie_alternative_titles_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "movie_watch_provider_links" ADD CONSTRAINT "movie_watch_provider_links_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "movie_watch_provider_links" ADD CONSTRAINT "movie_watch_provider_links_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "watch_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "movie_reviews" ADD CONSTRAINT "movie_reviews_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
