import { GenreRepository } from "../repositories/GenreRepository";
import { NotFoundError } from "../errors";

export class GenreService {
  static async listGenres() {
    return GenreRepository.list();
  }

  static async getGenre(id: string) {
    const genre = await GenreRepository.findById(id);
    if (!genre) throw new NotFoundError("Genre not found");
    return genre;
  }
}
