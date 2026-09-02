-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('TMDB', 'AI_ENRICHED', 'MANUAL');

-- CreateEnum
CREATE TYPE "AiEnrichmentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'NOT_FOUND');

-- AlterTable
ALTER TABLE "countries" ADD COLUMN     "source" "DataSource" NOT NULL DEFAULT 'TMDB';

-- AlterTable
ALTER TABLE "keywords" ADD COLUMN     "source" "DataSource" NOT NULL DEFAULT 'TMDB',
ALTER COLUMN "tmdbId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "languages" ADD COLUMN     "source" "DataSource" NOT NULL DEFAULT 'TMDB';

-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "aiEnrichmentAttemptedAt" TIMESTAMP(3),
ADD COLUMN     "aiEnrichmentStatus" "AiEnrichmentStatus" DEFAULT 'PENDING',
ADD COLUMN     "synopsisSource" "DataSource" NOT NULL DEFAULT 'TMDB';

-- AlterTable
ALTER TABLE "production_companies" ADD COLUMN     "source" "DataSource" NOT NULL DEFAULT 'TMDB';

-- CreateIndex
CREATE UNIQUE INDEX "keywords_name_key" ON "keywords"("name");

-- Backfill existing records (redundant for new deploys due to DEFAULT 'PENDING', but keeps history exact)
UPDATE "movies" SET "aiEnrichmentStatus" = 'PENDING' WHERE "aiEnrichmentStatus" IS NULL;
