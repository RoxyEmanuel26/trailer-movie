import { CollectionRepository } from "../repositories/CollectionRepository";
import { NotFoundError, ValidationError } from "../errors";
import { requireAdmin } from "../auth/utils";
import { prisma } from "../prisma";
import { clearAllPublicMemoryCaches, createMemoryCache } from "../memory-cache";
import { revalidatePath, revalidateTag } from "next/cache";
import { HOMEPAGE_CATALOG_TAG } from "../homepage-cache";

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function invalidateCollectionCaches(slug?: string | null) {
  clearAllPublicMemoryCaches();
  try {
    revalidateTag(HOMEPAGE_CATALOG_TAG, { expire: 0 });
    revalidatePath('/', 'page');
    revalidatePath('/sitemap.xml', 'page');
    if (slug) revalidatePath(`/collection/${slug}`, 'page');
  } catch {
    // Ignore outside Next.js server store
  }
}

const collectionBySlugCache = createMemoryCache<Awaited<ReturnType<typeof CollectionRepository.findBySlug>>>({
  maxEntries: 100,
  ttlMs: 15 * 60_000,
});

const activeFranchisesCache = createMemoryCache<Awaited<ReturnType<typeof CollectionRepository.listActiveFranchiseSummaries>>>({
  maxEntries: 30,
  ttlMs: 15 * 60_000,
});

export interface CollectionData {
  title: string;
  description?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  coverImageUrl?: string | null;
}

export class CollectionService {
  static async listCollections() {
    return CollectionRepository.listAll();
  }

  static async listActiveFranchiseGuides(page = 1, itemsPerPage = 24) {
    const safePage = Math.max(1, page);
    const take = Math.min(48, Math.max(1, itemsPerPage));
    const skip = (safePage - 1) * take;
    return activeFranchisesCache.getOrLoad(`${safePage}:${take}`, () =>
      CollectionRepository.listActiveFranchiseSummaries({ skip, take })
    );
  }

  static async getCollection(id: string) {
    const collection = await CollectionRepository.findById(id);
    if (!collection) throw new NotFoundError("Collection not found");
    return collection;
  }

  static async getBySlug(slug: string) {
    const collection = await collectionBySlugCache.getOrLoad(slug, () =>
      CollectionRepository.findBySlug(slug, true)
    );
    if (!collection) throw new NotFoundError(`Collection with slug ${slug} not found`);
    return collection;
  }

  static async createCollection(data: CollectionData) {
    await requireAdmin('create:collections');
    const slug = generateSlug(data.title);
    if (!slug) {
      throw new ValidationError('Collection title must contain at least one alphanumeric character');
    }

    const existing = await CollectionRepository.findBySlug(slug);
    if (existing) {
      throw new ValidationError(`Collection with slug '${slug}' already exists`);
    }

    const created = await CollectionRepository.create({
      title: data.title,
      slug,
      description: data.description,
      isActive: data.isActive ?? false,
      isFeatured: data.isFeatured ?? false,
      coverImageUrl: data.coverImageUrl,
    });
    invalidateCollectionCaches(created.slug);
    return created;
  }

  static async updateCollection(id: string, data: Partial<CollectionData>) {
    await requireAdmin('update:collections');
    const existing = await CollectionRepository.findById(id);
    if (!existing) throw new NotFoundError("Collection not found");

    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      slug = generateSlug(data.title);
      if (!slug) {
        throw new ValidationError('Collection title must contain at least one alphanumeric character');
      }
      const duplicate = await CollectionRepository.findBySlug(slug);
      if (duplicate && duplicate.id !== id) {
        throw new ValidationError(`Collection with slug '${slug}' already exists`);
      }
    }

    const updated = await CollectionRepository.update(id, {
      title: data.title ?? existing.title,
      slug,
      description: data.description !== undefined ? data.description : existing.description,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      isFeatured: data.isFeatured !== undefined ? data.isFeatured : existing.isFeatured,
      coverImageUrl: data.coverImageUrl !== undefined ? data.coverImageUrl : existing.coverImageUrl,
    });
    invalidateCollectionCaches(existing.slug);
    if (updated.slug !== existing.slug) invalidateCollectionCaches(updated.slug);
    return updated;
  }

  static async deleteCollection(id: string) {
    await requireAdmin('delete:collections');
    const existing = await CollectionRepository.findById(id);
    if (!existing) throw new NotFoundError("Collection not found");
    const deleted = await CollectionRepository.delete(id);
    invalidateCollectionCaches(existing.slug);
    return deleted;
  }

  static async deleteMany(ids: string[]) {
    await requireAdmin('delete:collections');
    const result = await CollectionRepository.deleteMany(ids);
    invalidateCollectionCaches();
    return result;
  }

  static async updateStatus(ids: string[], isActive: boolean) {
    await requireAdmin('update:collections');
    const result = await CollectionRepository.updateStatus(ids, isActive);
    invalidateCollectionCaches();
    return result;
  }

  static async updateFeatured(ids: string[], isFeatured: boolean) {
    await requireAdmin('update:collections');
    const result = await CollectionRepository.updateFeatured(ids, isFeatured);
    invalidateCollectionCaches();
    return result;
  }

  static async assignMovies(id: string, movieIds: string[]) {
    await requireAdmin('update:collections');
    const existing = await CollectionRepository.findById(id);
    if (!existing) throw new NotFoundError("Collection not found");

    const uniqueMovieIds = [...new Set(movieIds.filter((movieId) => typeof movieId === 'string' && movieId.trim()))];
    if (uniqueMovieIds.length > 0) {
      const activeMovies = await prisma.movie.findMany({
        where: { id: { in: uniqueMovieIds }, deletedAt: null },
        select: { id: true },
      });
      if (activeMovies.length !== uniqueMovieIds.length) {
        throw new ValidationError('One or more selected movies do not exist or have been deleted');
      }
    }

    const updated = await CollectionRepository.replaceMovies(id, uniqueMovieIds);
    invalidateCollectionCaches(existing.slug);
    return updated;
  }
}
