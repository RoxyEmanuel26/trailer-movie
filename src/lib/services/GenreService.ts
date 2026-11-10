import { GenreRepository } from "../repositories/GenreRepository";
import { NotFoundError, ValidationError } from "../errors";
import { requireAdmin } from "../auth/utils";
import { clearAllPublicMemoryCaches, createMemoryCache } from "../memory-cache";

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

const genreListCache = createMemoryCache<Awaited<ReturnType<typeof GenreRepository.list>>>({
  maxEntries: 2,
  ttlMs: 15 * 60_000,
});

const genreCountsCache = createMemoryCache<Awaited<ReturnType<typeof GenreRepository.listWithPublishedCounts>>>({
  maxEntries: 2,
  ttlMs: 10 * 60_000,
});

const genreBySlugCache = createMemoryCache<Awaited<ReturnType<typeof GenreRepository.findBySlug>>>({
  maxEntries: 100,
  ttlMs: 15 * 60_000,
});

export class GenreService {
  static async listGenres() {
    return genreListCache.getOrLoad('all-genres', () => GenreRepository.list());
  }

  static async listGenresWithPublishedCounts() {
    return genreCountsCache.getOrLoad('genres-with-counts', () => GenreRepository.listWithPublishedCounts());
  }

  static async getGenre(id: string) {
    const genre = await GenreRepository.findById(id);
    if (!genre) throw new NotFoundError("Genre not found");
    return genre;
  }

  static async getBySlug(slug: string) {
    const genre = await genreBySlugCache.getOrLoad(slug, () => GenreRepository.findBySlug(slug));
    if (!genre) throw new NotFoundError(`Genre with slug ${slug} not found`);
    return genre;
  }

  static async createGenre(data: { name: string; description?: string | null }) {
    await requireAdmin('write:genres');
    const slug = generateSlug(data.name);
    
    const existing = await GenreRepository.findBySlug(slug);
    if (existing) {
      throw new ValidationError(`Genre with slug '${slug}' already exists`);
    }

    const created = await GenreRepository.create({
      name: data.name,
      slug,
      description: data.description,
    });
    clearAllPublicMemoryCaches();
    return created;
  }

  static async updateGenre(id: string, data: { name?: string; description?: string | null }) {
    await requireAdmin('write:genres');
    const existing = await GenreRepository.findById(id);
    if (!existing) throw new NotFoundError("Genre not found");

    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = generateSlug(data.name);
      const duplicate = await GenreRepository.findBySlug(slug);
      if (duplicate && duplicate.id !== id) {
        throw new ValidationError(`Genre with slug '${slug}' already exists`);
      }
    }

    const updated = await GenreRepository.update(id, {
      name: data.name ?? existing.name,
      slug,
      description: data.description ?? existing.description,
    });
    clearAllPublicMemoryCaches();
    return updated;
  }

  static async deleteGenre(id: string) {
    await requireAdmin('write:genres');
    const existing = await GenreRepository.findById(id);
    if (!existing) throw new NotFoundError("Genre not found");
    const deleted = await GenreRepository.delete(id);
    clearAllPublicMemoryCaches();
    return deleted;
  }

  static async deleteMany(ids: string[]) {
    await requireAdmin('write:genres');
    const deleted = await GenreRepository.deleteMany(ids);
    clearAllPublicMemoryCaches();
    return deleted;
  }
}
