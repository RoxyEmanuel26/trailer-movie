import { CollectionRepository } from "../repositories/CollectionRepository";
import { NotFoundError, ValidationError } from "../errors";

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

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

  static async getCollection(id: string) {
    const collection = await CollectionRepository.findById(id);
    if (!collection) throw new NotFoundError("Collection not found");
    return collection;
  }

  static async getBySlug(slug: string) {
    const collection = await CollectionRepository.findBySlug(slug);
    if (!collection) throw new NotFoundError(`Collection with slug ${slug} not found`);
    return collection;
  }

  static async createCollection(data: CollectionData) {
    const slug = generateSlug(data.title);
    
    const existing = await CollectionRepository.findBySlug(slug);
    if (existing) {
      throw new ValidationError(`Collection with slug '${slug}' already exists`);
    }

    return CollectionRepository.create({
      title: data.title,
      slug,
      description: data.description,
      isActive: data.isActive ?? false,
      isFeatured: data.isFeatured ?? false,
      coverImageUrl: data.coverImageUrl,
    });
  }

  static async updateCollection(id: string, data: Partial<CollectionData>) {
    const existing = await CollectionRepository.findById(id);
    if (!existing) throw new NotFoundError("Collection not found");

    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      slug = generateSlug(data.title);
      const duplicate = await CollectionRepository.findBySlug(slug);
      if (duplicate && duplicate.id !== id) {
        throw new ValidationError(`Collection with slug '${slug}' already exists`);
      }
    }

    return CollectionRepository.update(id, {
      title: data.title ?? existing.title,
      slug,
      description: data.description !== undefined ? data.description : existing.description,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      isFeatured: data.isFeatured !== undefined ? data.isFeatured : existing.isFeatured,
      coverImageUrl: data.coverImageUrl !== undefined ? data.coverImageUrl : existing.coverImageUrl,
    });
  }

  static async deleteCollection(id: string) {
    const existing = await CollectionRepository.findById(id);
    if (!existing) throw new NotFoundError("Collection not found");
    return CollectionRepository.delete(id);
  }

  static async deleteMany(ids: string[]) {
    return CollectionRepository.deleteMany(ids);
  }

  static async updateStatus(ids: string[], isActive: boolean) {
    return CollectionRepository.updateStatus(ids, isActive);
  }

  static async updateFeatured(ids: string[], isFeatured: boolean) {
    return CollectionRepository.updateFeatured(ids, isFeatured);
  }

  static async assignMovies(id: string, movieIds: string[]) {
    const existing = await CollectionRepository.findById(id);
    if (!existing) throw new NotFoundError("Collection not found");
    
    return CollectionRepository.replaceMovies(id, movieIds);
  }
}
