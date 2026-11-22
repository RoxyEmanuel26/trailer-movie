import { Prisma } from '@prisma/client';
import { PersonRepository } from '../repositories/PersonRepository';
import { getPersonEnriched } from '../tmdb/api';
import { generateSlug } from '../tmdb/mapping';

function parseOptionalDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export class PersonImportService {
  static async enrich(tmdbId: number) {
    const data = await getPersonEnriched(tmdbId);
    const credits = Array.isArray(data.combined_credits?.cast) ? data.combined_credits.cast : [];
    const topMovies = credits
      .filter((movie: any) => movie.media_type === 'movie' && movie.poster_path)
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 15);

    const slugBase = generateSlug(data.name || '') || 'person';
    const personData: Prisma.PersonCreateInput = {
      name: data.name || `Person ${tmdbId}`,
      slug: `${slugBase}-${tmdbId}`,
      tmdbId,
      headshotUrl: data.profile_path ? `https://image.tmdb.org/t/p/w300${data.profile_path}` : null,
      biography: data.biography || null,
      birthday: parseOptionalDate(data.birthday),
      deathday: parseOptionalDate(data.deathday),
      placeOfBirth: data.place_of_birth || null,
      gender: typeof data.gender === 'number' ? data.gender : null,
      knownForDepartment: data.known_for_department || null,
      topMovies: topMovies.length > 0 ? (topMovies as Prisma.InputJsonValue) : Prisma.DbNull,
      imdbId: data.imdb_id || null,
      popularity: typeof data.popularity === 'number' ? data.popularity : null,
      tmdbSyncedAt: new Date(),
    };

    const person = await PersonRepository.upsert(tmdbId, personData, personData);
    return { personId: person.id, tmdbId };
  }
}
