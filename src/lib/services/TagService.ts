import { TagRepository } from "../repositories/TagRepository";
import { NotFoundError, ValidationError } from "../errors";
import { requireAdmin } from "../auth/utils";
import { clearAllPublicMemoryCaches, createMemoryCache } from "../memory-cache";
import { revalidatePath, revalidateTag } from "next/cache";
import { HOMEPAGE_CATALOG_TAG } from "../homepage-cache";

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function invalidateTagCaches(slug?: string | null) {
  clearAllPublicMemoryCaches();
  try {
    revalidateTag(HOMEPAGE_CATALOG_TAG, { expire: 0 });
    if (slug) revalidatePath(`/tag/${slug}`, 'page');
  } catch {
    // Ignore outside Next.js server store
  }
}

const tagBySlugCache = createMemoryCache<Awaited<ReturnType<typeof TagRepository.findBySlug>>>({
  maxEntries: 200,
  ttlMs: 15 * 60_000,
});

export class TagService {
  static async listTags() {
    return TagRepository.list();
  }

  static async getTag(id: string) {
    const tag = await TagRepository.findById(id);
    if (!tag) throw new NotFoundError("Tag not found");
    return tag;
  }

  static async getBySlug(slug: string) {
    const tag = await tagBySlugCache.getOrLoad(slug, () => TagRepository.findBySlug(slug));
    if (!tag) throw new NotFoundError(`Tag with slug ${slug} not found`);
    return tag;
  }

  static async createTag(data: { name: string }) {
    await requireAdmin('write:tags');
    const slug = generateSlug(data.name);
    if (!slug) {
      throw new ValidationError('Tag name must contain at least one alphanumeric character');
    }

    const existing = await TagRepository.findBySlug(slug);
    if (existing) {
      throw new ValidationError(`Tag with slug '${slug}' already exists`);
    }

    const created = await TagRepository.create({
      name: data.name,
      slug,
    });
    invalidateTagCaches(created.slug);
    return created;
  }

  static async updateTag(id: string, data: { name?: string }) {
    await requireAdmin('write:tags');
    const existing = await TagRepository.findById(id);
    if (!existing) throw new NotFoundError("Tag not found");

    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = generateSlug(data.name);
      if (!slug) {
        throw new ValidationError('Tag name must contain at least one alphanumeric character');
      }
      const duplicate = await TagRepository.findBySlug(slug);
      if (duplicate && duplicate.id !== id) {
        throw new ValidationError(`Tag with slug '${slug}' already exists`);
      }
    }

    const updated = await TagRepository.update(id, {
      name: data.name ?? existing.name,
      slug,
    });
    invalidateTagCaches(existing.slug);
    if (updated.slug !== existing.slug) invalidateTagCaches(updated.slug);
    return updated;
  }

  static async deleteTag(id: string) {
    await requireAdmin('write:tags');
    const existing = await TagRepository.findById(id);
    if (!existing) throw new NotFoundError("Tag not found");
    const deleted = await TagRepository.delete(id);
    invalidateTagCaches(existing.slug);
    return deleted;
  }

  static async deleteMany(ids: string[]) {
    await requireAdmin('write:tags');
    const result = await TagRepository.deleteMany(ids);
    invalidateTagCaches();
    return result;
  }
}
