import { CollectionRepository } from "../repositories/CollectionRepository";

export class CollectionService {
  static async listCollections() {
    return CollectionRepository.listActive();
  }
}
