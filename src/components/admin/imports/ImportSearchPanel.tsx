"use client"

import * as React from "react"
import { useDebouncedCallback } from "use-debounce"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { TmdbMovieCard } from "./TmdbMovieCard"

export function ImportSearchPanel() {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<any[]>([])
  const [isSearching, setIsSearching] = React.useState(false)

  const searchTmdb = useDebouncedCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/admin/imports/search?query=${encodeURIComponent(searchTerm)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.data?.results || [])
      } else {
        setResults([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSearching(false)
    }
  }, 500)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsSearching(true)
    searchTmdb(e.target.value)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative w-full max-w-2xl">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search TMDB for movies (e.g. Inception, Avatar)..."
          className="pl-10 h-12 text-lg"
          value={query}
          onChange={handleInputChange}
        />
      </div>

      <div className="min-h-[300px]">
        {isSearching ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            Searching TMDB...
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((movie) => (
              <TmdbMovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : query.trim() !== "" ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No results found on TMDB for "{query}".
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
            Search for a movie to import it into your catalog.
          </div>
        )}
      </div>
    </div>
  )
}
