"use client"

import * as React from "react"
import { Calendar, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface TmdbMovie {
  id: number
  title: string
  overview: string
  release_date: string
  poster_path: string | null
}

interface TmdbMovieCardProps {
  movie: TmdbMovie
}

export function TmdbMovieCard({ movie }: TmdbMovieCardProps) {
  const [isImporting, setIsImporting] = React.useState(false)

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const res = await fetch("/api/admin/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.id }),
      })
      if (!res.ok) throw new Error("Failed to queue import")
      toast.success(`Import queued for ${movie.title}`)
    } catch (error) {
      toast.error("An error occurred while queuing import")
    } finally {
      setIsImporting(false)
    }
  }

  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` 
    : null

  const year = movie.release_date ? movie.release_date.split("-")[0] : "N/A"

  return (
    <div className="flex flex-col md:flex-row gap-4 border rounded-md p-4 bg-card text-card-foreground shadow-sm">
      <div className="w-full md:w-[120px] shrink-0 flex items-center justify-center bg-muted rounded-md overflow-hidden aspect-[2/3]">
        {posterUrl ? (
          <img 
            src={posterUrl} 
            alt={movie.title} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <ImageIcon className="h-10 w-10 text-muted-foreground opacity-50" />
        )}
      </div>
      <div className="flex flex-col flex-1">
        <h3 className="font-bold text-lg leading-tight">{movie.title}</h3>
        <div className="flex items-center text-sm text-muted-foreground mt-1 gap-2">
          <Calendar className="h-4 w-4" />
          <span>{year}</span>
          <span className="text-xs border px-1.5 py-0.5 rounded-sm">TMDB ID: {movie.id}</span>
        </div>
        <p className="text-sm mt-3 line-clamp-3 opacity-80 flex-1">
          {movie.overview || "No overview available."}
        </p>
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleImport} 
            disabled={isImporting}
          >
            {isImporting ? "Queuing..." : "Import"}
          </Button>
        </div>
      </div>
    </div>
  )
}
