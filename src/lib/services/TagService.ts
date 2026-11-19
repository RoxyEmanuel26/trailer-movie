import { TagRepository } from "../repositories/TagRepository";
import { NotFoundError, ValidationError } from "../errors";
import { requireAdmin } from "../auth/utils";
import { clearAllPublicMemoryCaches, createMemoryCache } from "../memory-cache";

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
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
    
    const existing = await TagRepository.findBySlug(slug);
    if (existing) {
      throw new ValidationError(`Tag with slug '${slug}' already exists`);
    }

    return TagRepository.create({
      name: data.name,
      slug,
    });
  }

  static async updateTag(id: string, data: { name?: string }) {
    await requireAdmin('write:tags');
    const existing = await TagRepository.findById(id);
    if (!existing) throw new NotFoundError("Tag not found");

    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = generateSlug(data.name);
      const duplicate = await TagRepository.findBySlug(slug);
      if (duplicate && duplicate.id !== id) {
        throw new ValidationError(`Tag with slug '${slug}' already exists`);
      }
    }

    return TagRepository.update(id, {
      name: data.name ?? existing.name,
      slug,
    });
  }

  static async deleteTag(id: string) {
    await requireAdmin('write:tags');
    const existing = await TagRepository.findById(id);
    if (!existing) throw new NotFoundError("Tag not found");
    return TagRepository.delete(id);
  }

  static async deleteMany(ids: string[]) {
    await requireAdmin('write:tags');
    return TagRepository.deleteMany(ids);
  }
}
