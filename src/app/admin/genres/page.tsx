import * as React from "react"
import { GenreService } from "@/lib/services/GenreService"
import { GenresClientWrapper } from "@/components/admin/genres/GenresClientWrapper"

export default async function GenresPage() {
  const genres = await GenreService.listGenres()

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Genres</h1>
        <p className="text-muted-foreground">Manage your movie genres and classifications.</p>
      </div>

      <GenresClientWrapper initialData={genres} />
    </div>
  )
}
