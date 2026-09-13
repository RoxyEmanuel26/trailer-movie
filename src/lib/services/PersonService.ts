import { cache } from 'react';
import { PersonRepository } from '../repositories/PersonRepository';
import { personPath } from '../public-routes';

const TMDB_ID_SUFFIX = /-(\d+)$/;

export class PersonService {
  static getPublicProfile = cache(async (routeParam: string) => {
    const canonicalPerson = await PersonRepository.findPublicProfileBySlug(routeParam);
    if (canonicalPerson) {
      return {
        person: canonicalPerson,
        canonicalPath: personPath(canonicalPerson.slug),
        shouldRedirect: false,
      };
    }

    const legacyPerson = await PersonRepository.findPublicProfileById(routeParam);
    if (legacyPerson) {
      return {
        person: legacyPerson,
        canonicalPath: personPath(legacyPerson.slug),
        shouldRedirect: true,
      };
    }

    const tmdbIdMatch = routeParam.match(TMDB_ID_SUFFIX);
    const tmdbId = tmdbIdMatch ? Number(tmdbIdMatch[1]) : NaN;
    if (Number.isSafeInteger(tmdbId) && tmdbId > 0) {
      const renamedPerson = await PersonRepository.findPublicProfileByTmdbId(tmdbId);
      if (renamedPerson) {
        return {
          person: renamedPerson,
          canonicalPath: personPath(renamedPerson.slug),
          shouldRedirect: true,
        };
      }
    }

    return null;
  });
}
