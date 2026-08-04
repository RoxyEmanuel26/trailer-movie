import { HomepageRepository } from '../repositories/HomepageRepository';
import { Prisma } from '@prisma/client';
import { cache } from 'react';

export class HomepageService {
  // ---------------------------------------------------------------------------
  // Sections
  // ---------------------------------------------------------------------------

  static listSections = cache(async () => {
    return HomepageRepository.listSections();
  });

  static getSection = cache(async (id: string) => {
    const section = await HomepageRepository.getSection(id);
    if (!section) throw new Error(`Section not found: ${id}`);
    return section;
  });

  static async createSection(data: Prisma.HomepageSectionUncheckedCreateInput) {
    // Determine sortOrder if not provided
    if (data.sortOrder === undefined) {
      const existing = await HomepageRepository.listSections();
      data.sortOrder = existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;
    }
    return HomepageRepository.createSection(data);
  }

  static async updateSection(id: string, data: Prisma.HomepageSectionUncheckedUpdateInput) {
    return HomepageRepository.updateSection(id, data);
  }

  static async deleteSection(id: string) {
    return HomepageRepository.deleteSection(id);
  }

  static async reorderSections(orderedIds: string[]) {
    const updates = orderedIds.map((id, index) => ({ id, sortOrder: index }));
    return HomepageRepository.updateSectionOrder(updates);
  }

  // ---------------------------------------------------------------------------
  // Featured Items
  // ---------------------------------------------------------------------------

  static listFeaturedItems = cache(async () => {
    return HomepageRepository.listFeaturedItems();
  });

  static async addFeaturedItem(data: Prisma.FeaturedItemUncheckedCreateInput) {
    if (data.sortOrder === undefined) {
      const existing = await HomepageRepository.listFeaturedItems();
      data.sortOrder = existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;
    }
    return HomepageRepository.createFeaturedItem(data);
  }

  static async updateFeaturedItem(id: string, data: Prisma.FeaturedItemUncheckedUpdateInput) {
    return HomepageRepository.updateFeaturedItem(id, data);
  }

  static async removeFeaturedItem(id: string) {
    return HomepageRepository.deleteFeaturedItem(id);
  }

  static async reorderFeaturedItems(orderedIds: string[]) {
    const updates = orderedIds.map((id, index) => ({ id, sortOrder: index }));
    return HomepageRepository.updateFeaturedItemOrder(updates);
  }

  // ---------------------------------------------------------------------------
  // UI Data Retrieval
  // ---------------------------------------------------------------------------

  static getSectionData = cache(async (section: any) => {
    return HomepageRepository.getSectionData(section);
  });
}
