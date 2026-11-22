import { z } from 'zod';
import { sanitizeHtml, sanitizeRichText } from '../../security/sanitize';
import { extractYouTubeId } from '../../utils/youtube';

const safeString = z.string().trim().transform((val) => sanitizeHtml(val));
const safeRichText = z.string().trim().transform((val) => sanitizeRichText(val));

/**
 * Shared generic validations
 */
const CuidSchema = z.string().cuid('Invalid ID format');
const TmdbIdSchema = z.number().int().positive('Invalid TMDB ID');

/**
 * Search Schema
 */
export const SearchSchema = z.object({
  query: safeString.refine(s => s.length > 0 && s.length <= 100, { message: 'Search query must be between 1 and 100 characters' }),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

/**
 * Import Schema
 */
export const ImportSchema = z.object({
  tmdbId: TmdbIdSchema,
  forceRefresh: z.boolean().optional().default(false),
});

export const ImportListSchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'PARTIAL', 'COMPLETED', 'FAILED', 'SKIPPED', 'CANCELED']).optional(),
  entityType: z.enum(['Movie', 'Person']).optional(),
  stage: z.string().trim().max(50).optional(),
  retryable: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  includeCompleted: z.enum(['true', 'false']).transform((value) => value === 'true').optional().default(false),
  includeTotal: z.enum(['true', 'false']).transform((value) => value === 'true').optional().default(true),
});

export const AdminMovieListQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).max(500_000).default(0),
  take: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(120).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'releaseDate', 'title', 'popularity', 'voteAverage']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date');

export const ImportBatchSchema = z.object({
  startDate: IsoDateSchema,
  endDate: IsoDateSchema,
  country: z.string().regex(/^[A-Z]{2}$/).optional(),
}).refine((data) => data.startDate <= data.endDate, { message: 'startDate must be before or equal to endDate' });

/**
 * Movie Update Schema (Example for Admin edits)
 */
const optionalYoutubeTrailerIdSchema = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return extractYouTubeId(trimmed) ?? trimmed;
  },
  z.string()
    .regex(/^[A-Za-z0-9_-]{11}$/, 'Invalid YouTube trailer URL or 11-character video ID')
    .optional()
    .nullable(),
);

export const MovieAdminUpdateSchema = z.object({
  title: safeString.refine(s => s.length > 0, "Title is required").optional(),
  synopsis: safeRichText.optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  youtubeTrailerId: optionalYoutubeTrailerIdSchema,
  lockedFields: z.array(z.string()).optional(),
});

/**
 * Genre Schemas
 */
export const GenreInputSchema = z.object({
  name: safeString.refine(s => s.length > 0, "Name is required"),
  description: safeRichText.optional().nullable(),
});

/**
 * Tag Schemas
 */
export const TagInputSchema = z.object({
  name: safeString.refine(s => s.length > 0, "Name is required"),
});

/**
 * Collection Schemas
 */
const optionalUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value),
  z.string()
    .url('Must be a valid URL')
    .refine((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'URL must use http or https protocol')
    .optional()
    .nullable(),
);

export const CollectionInputSchema = z.object({
  title: safeString.refine(s => s.length > 0, "Title is required"),
  description: safeRichText.optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  coverImageUrl: optionalUrlSchema,
});

export const BulkIdsSchema = z.object({
  ids: z.array(z.string()),
});

export const BulkStatusSchema = BulkIdsSchema.extend({
  isActive: z.boolean(),
});

export const BulkFeaturedSchema = BulkIdsSchema.extend({
  isFeatured: z.boolean(),
});

export const CollectionMoviesSchema = z.object({
  movieIds: z.array(z.string()),
});

/**
 * SEO Update Schema
 */
export const SeoUpdateSchema = z.object({
  metaTitle: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().max(300).optional().nullable(),
  ),
  metaDescription: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().max(600).optional().nullable(),
  ),
  canonicalUrl: optionalUrlSchema,
});

/**
 * Favorite Schema
 */
export const FavoriteSchema = z.object({
  movieId: CuidSchema,
});

/**
 * Settings Schema
 */
export const SettingUpdateSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.enum(['STRING', 'BOOLEAN', 'INTEGER', 'JSON']),
  group: z.string().optional(),
});

/**
 * Trailer Schema (Example for manual admin override)
 */
export const TrailerUpdateSchema = z.object({
  title: z.string().optional(),
  isPrimary: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

/**
 * User Schema (Example for admin assigning roles)
 */
export const UserUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  roleId: z.string().cuid().optional().nullable(),
});

/**
 * Homepage Schemas
 */
export const HomepageSectionInputSchema = z.object({
  systemKey: z.string().min(1).max(80).optional().nullable(),
  title: z.string().min(1, "Title is required"),
  type: z.enum([
    "AUTO_RECENT",
    "AUTO_UPCOMING",
    "AUTO_TRENDING",
    "MANUAL_COLLECTION",
    "GENRE_BASED",
    "AD_SLOT"
  ]),
  collectionId: z.string().cuid().optional().nullable(),
  genreId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const FeaturedItemInputSchema = z.object({
  movieId: z.string().cuid("Movie is required"),
  customHeadline: z.string().optional().nullable(),
  customBackdropUrl: optionalUrlSchema,
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const ReorderSchema = z.object({
  orderedIds: z.array(z.string().cuid()),
});

export const GlobalSeoSettingsSchema = z.object({
  defaultTitle: z.string().optional().default(''),
  defaultDescription: z.string().optional().default(''),
  defaultKeywords: z.string().optional().default(''),
  ogSiteName: z.string().optional().default(''),
  twitterHandle: z.string().optional().default(''),
  googleVerification: z.string().optional().default(''),
  bingVerification: z.string().optional().default(''),
  yandexVerification: z.string().optional().default(''),
});
