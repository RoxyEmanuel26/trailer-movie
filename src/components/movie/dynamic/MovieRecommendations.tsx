import * as React from "react"
import { prisma } from "@/lib/prisma"
import { MovieCard } from "@/components/public/MovieCard"

export async function MovieRecommendations({ 
  movieId, 
  genreIds 
}: { 
  movieId: string, 
  genreIds: string[] 
}) {
  if (!genreIds || genreIds.length === 0) return null;

  let movies: any[] = [];
  try {
    movies = await prisma.movie.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: movieId },
        genres: {
          some: {
            genreId: { in: genreIds }
          }
        }
      },
      take: 5,
      orderBy: { releaseDate: 'desc' },
      include: {
        genres: { include: { genre: true } }
      }
    });
  } catch (error) {
    console.error('Failed to fetch recommendations from DB:', error);
    return null;
  }

  if (movies.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-xl font-semibold mb-6">You May Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </div>
  )
}

export function MovieRecommendationsSkeleton() {
  return (
    <div className="mt-12 animate-pulse">
      <div className="h-6 w-48 bg-muted rounded mb-6"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-[2/3] w-full rounded-xl bg-muted"></div>
            <div className="h-4 w-3/4 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}