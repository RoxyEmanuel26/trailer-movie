import { GenreRepository } from "../repositories/GenreRepository";
import { NotFoundError, ValidationError } from "../errors";
import { requireAdmin } from "../auth/utils";

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export class GenreService {
  static async listGenres() {
    return GenreRepository.list();
  }

  static async getGenre(id: string) {
    const genre = await GenreRepository.findById(id);
    if (!genre) throw new NotFoundError("Genre not found");
    return genre;
  }

  static async getBySlug(slug: string) {
    const genre = await GenreRepository.findBySlug(slug);
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

    return GenreRepository.create({
      name: data.name,
      slug,
      description: data.description,
    });
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

    return GenreRepository.update(id, {
      name: data.name ?? existing.name,
      slug,
      description: data.description ?? existing.description,
    });
  }

  static async deleteGenre(id: string) {
    await requireAdmin('write:genres');
    const existing = await GenreRepository.findById(id);
    if (!existing) throw new NotFoundError("Genre not found");
    return GenreRepository.delete(id);
  }

  static async deleteMany(ids: string[]) {
    await requireAdmin('write:genres');
    return GenreRepository.deleteMany(ids);
  }
}
