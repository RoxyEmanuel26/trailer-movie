import * as React from "react"
import { Badge } from "@/components/ui/badge"

export interface MovieCardProps {
  title: string
  posterPath?: string
  releaseYear?: number
  rating?: number
  genres?: string[]
}

export function MovieCard({ title, posterPath, releaseYear, rating, genres }: MovieCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow transition-all hover:shadow-md">
      <div className="aspect-[2/3] w-full bg-muted">
        {posterPath ? (
          <img src={posterPath} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm font-medium">
            Coming Soon
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold leading-none tracking-tight">{title}</h3>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          {releaseYear && <span>{releaseYear}</span>}
          {rating && (
            <span className="flex items-center gap-1">
              ⭐ {rating.toFixed(1)}
            </span>
          )}
        </div>
        {genres && genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {genres.slice(0, 3).map((g) => (
              <Badge key={g} variant="secondary" className="text-[10px]">
                {g}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
