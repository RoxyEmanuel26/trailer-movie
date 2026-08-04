"use client"

import * as React from "react"
import { MoviesTable } from "@/components/admin/movies/MoviesTable"
import { MoviesToolbar } from "@/components/admin/movies/MoviesToolbar"
import { MovieEditDialog } from "@/components/admin/movies/MovieEditDialog"

interface MoviesClientWrapperProps {
  data: any[]
  total: number
  skip: number
  take: number
}

export function MoviesClientWrapper({ data, total, skip, take }: MoviesClientWrapperProps) {
  const [editingMovie, setEditingMovie] = React.useState<any | null>(null)
  
  return (
    <div className="flex flex-col gap-4 w-full">
      <MoviesToolbar />
      <MoviesTable 
        data={data} 
        total={total} 
        skip={skip} 
        take={take} 
        onEdit={(movie) => setEditingMovie(movie)} 
      />
      
      <MovieEditDialog 
        movie={editingMovie} 
        open={!!editingMovie} 
        onOpenChange={(open) => !open && setEditingMovie(null)} 
      />
    </div>
  )
}
