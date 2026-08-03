import { z } from 'zod';

/**
 * Shared generic validations
 */
const CuidSchema = z.string().cuid('Invalid ID format');
const TmdbIdSchema = z.number().int().positive('Invalid TMDB ID');

/**
 * Search Schema
 */
export const SearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query is too long'),
  page: z.coerce.number().int().min(1).default(1),
});

/**
 * Import Schema
 */
export const ImportSchema = z.object({
  tmdbId: TmdbIdSchema,
});

/**
 * Movie Update Schema (Example for Admin edits)
 */
export const MovieAdminUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  synopsis: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  lockedFields: z.array(z.string()).optional(),
});

/**
 * Genre Update Schema
 */
export const GenreUpdateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
});

/**
 * Tag Update Schema
 */
export const TagUpdateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
});

/**
 * Collection Update Schema
 */
export const CollectionUpdateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * SEO Update Schema
 */
export const SeoUpdateSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().url().optional().nullable(),
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
