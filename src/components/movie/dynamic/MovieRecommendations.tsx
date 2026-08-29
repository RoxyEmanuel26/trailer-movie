import * as React from "react"
import { getMovieRecommendations } from "@/lib/tmdb/api"
import { MovieCard } from "@/components/public/MovieCard"

export async function MovieRecommendations({ tmdbId }: { tmdbId: number }) {
  let movies: any[] = [];
  try {
    const data = await getMovieRecommendations(tmdbId);
    movies = data.results || [];
  } catch (error) {
    console.error(`Failed to fetch recommendations for TMDB ${tmdbId}:`, error);
  }

  if (movies.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-xl font-semibold mb-6">Similar Recommendations (from TMDB)</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {movies.slice(0, 5).map((m: any) => (
          <div key={m.id} className="group relative flex flex-col gap-2 overflow-hidden">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted">
              {m.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w500${m.poster_path}`} alt={m.title} className="object-cover w-full h-full" />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted text-muted-foreground text-sm font-medium">Coming Soon</div>
              )}
            </div>
            <h3 className="line-clamp-1 font-semibold leading-tight tracking-tight text-sm">{m.title}</h3>
          </div>
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