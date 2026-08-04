"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronUp, ChevronDown, Trash2, Search, Plus } from "lucide-react"

// Types based on the Prisma includes
type Movie = {
  id: string
  title: string
  status: string
  releaseDate: string
}

type CollectionMovie = {
  movieId: string
  sortOrder: number
  movie: Movie
}

export function CollectionDetailClient({ collection }: { collection: any }) {
  const router = useRouter()
  
  const [movies, setMovies] = React.useState<CollectionMovie[]>(
    collection.movies || []
  )
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<Movie[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const res = await fetch(`/api/admin/movies?search=${encodeURIComponent(searchQuery)}&take=10`)
      const json = await res.json()
      if (res.ok) {
        setSearchResults(json.data.data || [])
      }
    } catch (err) {
      toast.error("Error", { description: "Failed to update movies" })
    } finally {
      setIsSearching(false)
    }
  }

  const addMovie = (movie: Movie) => {
    if (movies.find(m => m.movieId === movie.id)) {
      toast("Movie already in collection")
      return
    }
    
    setMovies(prev => [
      ...prev,
      {
        movieId: movie.id,
        sortOrder: prev.length,
        movie
      }
    ])
  }

  const removeMovie = (movieId: string) => {
    setMovies(prev => prev.filter(m => m.movieId !== movieId))
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newArr = [...movies]
    const temp = newArr[index - 1]
    newArr[index - 1] = newArr[index]
    newArr[index] = temp
    setMovies(newArr)
  }

  const moveDown = (index: number) => {
    if (index === movies.length - 1) return
    const newArr = [...movies]
    const temp = newArr[index + 1]
    newArr[index + 1] = newArr[index]
    newArr[index] = temp
    setMovies(newArr)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const movieIds = movies.map(m => m.movieId)
      const res = await fetch(`/api/admin/collections/${collection.id}/movies`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieIds })
      })

      if (!res.ok) throw new Error("Failed to save movies")
      
      toast.success("Collection updated successfully")
      router.refresh()
    } catch (err) {
      toast.error("Error", { description: "Failed to save collection movies" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Search and Add panel */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Add Movies</h3>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies by title..."
          />
          <Button type="submit" disabled={isSearching}>
            <Search className="w-4 h-4" />
          </Button>
        </form>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
          {searchResults.map(movie => (
            <Card key={movie.id}>
              <CardContent className="p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{movie.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(movie.releaseDate).getFullYear()} • {movie.status}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => addMovie(movie)}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardContent>
            </Card>
          ))}
          {searchResults.length === 0 && searchQuery && !isSearching && (
            <div className="text-center text-muted-foreground p-4">No results found.</div>
          )}
        </div>
      </div>

      {/* Reorder and Save panel */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Movies in Collection ({movies.length})</h3>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Order"}
          </Button>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
          {movies.length === 0 ? (
            <div className="text-center text-muted-foreground p-4 border rounded-md border-dashed">
              No movies in this collection yet.
            </div>
          ) : (
            movies.map((m, idx) => (
              <Card key={m.movieId}>
                <CardContent className="p-3 flex justify-between items-center gap-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{idx + 1}. {m.movie.title}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveUp(idx)} disabled={idx === 0}>
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveDown(idx)} disabled={idx === movies.length - 1}>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMovie(m.movieId)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
