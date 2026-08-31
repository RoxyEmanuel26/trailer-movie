import { SyncService } from './src/lib/services/import-service';
import { prisma } from './src/lib/prisma';

async function verifyImport() {
  try {
    const tmdbId = 1368337;
    console.log('Starting import for TMDB ID: ' + tmdbId);
    
    // Fetch from database with all relations
    console.log('\n--- Fetching comprehensive data from DB ---');
    const dbMovie = await prisma.movie.findUnique({
      where: { tmdbId },
      include: {
        genres: { include: { genre: true } },
        people: { include: { person: true } },
        companies: { include: { company: true } },
        keywords: { include: { keyword: true } },
        countries: { include: { country: true } },
        languages: { include: { language: true } },
        collections: { include: { collection: true } },
        trailers: true
      }
    });

    if (!dbMovie) {
      console.error("Movie not found in DB after import!");
      return;
    }

    console.log("\n[BASE DATA]");
    console.log('Title: ' + dbMovie.title);
    console.log('Slug: ' + dbMovie.slug);
    console.log('Release Date: ' + dbMovie.releaseDate);
    console.log('Budget: ' + dbMovie.budget);
    console.log('Revenue: ' + dbMovie.revenue);
    console.log('Age Rating: ' + dbMovie.ageRating);
    console.log('MPAA Rating: ' + dbMovie.mpaaRating);
    console.log('Synopsis Length: ' + (dbMovie.synopsis ? dbMovie.synopsis.length : 0) + ' chars');

    console.log("\n[RELATIONS]");
    console.log('Genres: ' + dbMovie.genres.map((g: any) => g.genre.name).join(', '));
    console.log('Countries: ' + dbMovie.countries.map((c: any) => c.country.name).join(', '));
    console.log('Languages: ' + dbMovie.languages.map((l: any) => l.language.name).join(', '));
    console.log('Keywords: ' + dbMovie.keywords.length + ' tags');
    console.log('Companies: ' + dbMovie.companies.map((c: any) => c.company.name).join(', '));
    console.log('Trailers: ' + dbMovie.trailers.length + ' videos');
    
    console.log("\n[CREW & CAST (CREDITS)]");
    const directors = dbMovie.people.filter((c: any) => c.roleType === 'DIRECTOR');
    const writers = dbMovie.people.filter((c: any) => c.roleType === 'WRITER');
    const producers = dbMovie.people.filter((c: any) => c.roleType === 'PRODUCER');
    const actors = dbMovie.people.filter((c: any) => c.roleType === 'ACTOR');
    
    console.log('Directors: ' + directors.map((d: any) => d.person.name).join(', '));
    console.log('Writers: ' + writers.map((w: any) => w.person.name).join(', '));
    console.log('Producers: ' + producers.map((p: any) => p.person.name).join(', '));
    console.log('Actors (Top 10): ' + actors.map((a: any) => a.person.name).join(', '));

    console.log("\n[COLLECTIONS]");
    console.log(dbMovie.collections.length > 0 ? dbMovie.collections.map((c: any) => c.collection.title).join(', ') : 'None');

  } catch (error) {
    console.error("Error during import verification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyImport();
