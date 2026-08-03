import { Prisma, PersonRoleType } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class PersonRepository {
  static async upsert(
    tmdbId: number,
    create: Prisma.PersonCreateInput,
    update: Prisma.PersonUpdateInput,
    db: DbClient = prisma
  ) {
    return db.person.upsert({
      where: { tmdbId },
      create,
      update,
    });
  }

  static async clearMovieRole(movieId: string, roleType: PersonRoleType, db: DbClient = prisma) {
    return db.moviePerson.deleteMany({
      where: { movieId, roleType },
    });
  }

  static async linkMoviePerson(
    data: Prisma.MoviePersonUncheckedCreateInput,
    db: DbClient = prisma
  ) {
    return db.moviePerson.create({ data });
  }
}
