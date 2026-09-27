import { HomepageRepository } from '../repositories/HomepageRepository';
import { Prisma } from '@prisma/client';
import { cache } from 'react';
import { requireAdmin } from '../auth/utils';
import { revalidatePath } from 'next/cache';

function revalidateHomepage() {
  revalidatePath('/', 'page');
  revalidatePath('/opengraph-image', 'page');
  revalidatePath('/sitemap.xml', 'page');
}

export class HomepageService {
  // ---------------------------------------------------------------------------
  // Sections
  // ---------------------------------------------------------------------------

  static listSections = cache(async () => {
    await HomepageRepository.ensureSystemSections();
    return HomepageRepository.listSections();
  });

  static getSection = cache(async (id: string) => {
    const section = await HomepageRepository.getSection(id);
    if (!section) throw new Error(`Section not found: ${id}`);
    return section;
  });

  static async createSection(data: Prisma.HomepageSectionUncheckedCreateInput) {
    await requireAdmin('write:homepage');
    // Determine sortOrder if not provided
    if (data.sortOrder === undefined) {
      const existing = await HomepageRepository.listSections();
      data.sortOrder = existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;
    }
    const section = await HomepageRepository.createSection(data);
    revalidateHomepage();
    return section;
  }

  static async updateSection(id: string, data: Prisma.HomepageSectionUncheckedUpdateInput) {
    await requireAdmin('write:homepage');
    const section = await HomepageRepository.updateSection(id, data);
    revalidateHomepage();
    return section;
  }

  static async deleteSection(id: string) {
    await requireAdmin('write:homepage');
    const existing = await HomepageRepository.getSection(id);
    if (!existing) throw new Error(`Section not found: ${id}`);
    const section = existing.systemKey
      ? await HomepageRepository.updateSection(id, { isActive: false })
      : await HomepageRepository.deleteSection(id);
    revalidateHomepage();
    return section;
  }

  static async reorderSections(orderedIds: string[]) {
    await requireAdmin('write:homepage');
    const updates = orderedIds.map((id, index) => ({ id, sortOrder: index }));
    const sections = await HomepageRepository.updateSectionOrder(updates);
    revalidateHomepage();
    return sections;
  }

  // ---------------------------------------------------------------------------
  // Featured Items
  // ---------------------------------------------------------------------------

  static listFeaturedItems = cache(async () => {
    return HomepageRepository.listFeaturedItems();
  });

  static async addFeaturedItem(data: Prisma.FeaturedItemUncheckedCreateInput) {
    await requireAdmin('write:homepage');
    if (data.sortOrder === undefined) {
      const existing = await HomepageRepository.listFeaturedItems();
      data.sortOrder = existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;
    }
    const item = await HomepageRepository.createFeaturedItem(data);
    revalidateHomepage();
    return item;
  }

  static async updateFeaturedItem(id: string, data: Prisma.FeaturedItemUncheckedUpdateInput) {
    await requireAdmin('write:homepage');
    const item = await HomepageRepository.updateFeaturedItem(id, data);
    revalidateHomepage();
    return item;
  }

  static async removeFeaturedItem(id: string) {
    await requireAdmin('write:homepage');
    const item = await HomepageRepository.deleteFeaturedItem(id);
    revalidateHomepage();
    return item;
  }

  static async reorderFeaturedItems(orderedIds: string[]) {
    await requireAdmin('write:homepage');
    const updates = orderedIds.map((id, index) => ({ id, sortOrder: index }));
    const items = await HomepageRepository.updateFeaturedItemOrder(updates);
    revalidateHomepage();
    return items;
  }

  // ---------------------------------------------------------------------------
  // UI Data Retrieval
  // ---------------------------------------------------------------------------

  static getSectionData = cache(async (section: any) => {
    return HomepageRepository.getSectionData(section);
  });

  static getPublicDiscoveryData = cache(async () => {
    return HomepageRepository.getPublicDiscoveryData();
  });

  static getSmartHomepageData = cache(async () => {
    return HomepageRepository.getSmartHomepageData();
  });
}
