import { CollectionRepository } from '../repositories/CollectionRepository';

export class HomepageService {
  static async getActiveCollections() {
    // In a real scenario, this would orchestrate pulling different sections for the homepage
    // like "Upcoming", "Recent", and manual collections.
    return CollectionRepository.listActive();
  }
}
