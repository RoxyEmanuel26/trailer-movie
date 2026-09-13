import { PersonRepository } from '../repositories/PersonRepository';
import { getPersonEnriched } from '../tmdb/api';
import { generateSlug } from '../tmdb/mapping';

export class PersonImportService {
  static async enrich(tmdbId: number) {
    const data = await getPersonEnriched(tmdbId);
    const credits = data.combined_credits?.cast || [];
    const topMovies = credits
      .filter((movie: any) => movie.media_type === 'movie' && movie.poster_path)
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 15);

    const personData = {
      name: data.name,
      slug: `${generateSlug(data.name)}-${tmdbId}`,
      tmdbId,
      headshotUrl: data.profile_path ? `https://image.tmdb.org/t/p/w300${data.profile_path}` : null,
      biography: data.biography || null,
      birthday: data.birthday ? new Date(data.birthday) : null,
      deathday: data.deathday ? new Date(data.deathday) : null,
      placeOfBirth: data.place_of_birth || null,
      gender: typeof data.gender === 'number' ? data.gender : null,
      knownForDepartment: data.known_for_department || null,
      topMovies: topMovies.length > 0 ? topMovies : null,
      imdbId: data.imdb_id || null,
      popularity: typeof data.popularity === 'number' ? data.popularity : null,
      tmdbSyncedAt: new Date(),
    };

    const person = await PersonRepository.upsert(tmdbId, personData as any, personData as any);
    return { personId: person.id, tmdbId };
  }
}
