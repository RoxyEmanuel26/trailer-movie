import * as React from "react"
import { MovieService } from "@/lib/services/MovieService"
import { MoviesClientWrapper } from "@/components/admin/movies/MoviesClientWrapper"

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  
  const rawSkip = typeof params.skip === "string" ? Number.parseInt(params.skip, 10) : 0
  const rawTake = typeof params.take === "string" ? Number.parseInt(params.take, 10) : 50
  const skip = Number.isFinite(rawSkip) && rawSkip >= 0 ? Math.min(rawSkip, 500_000) : 0
  const take = Number.isFinite(rawTake) && rawTake >= 1 ? Math.min(rawTake, 100) : 50
  const search = typeof params.search === "string" ? params.search.trim().slice(0, 120) || undefined : undefined
  const allowedStatuses = new Set(["DRAFT", "PUBLISHED", "ARCHIVED"])
  const status = typeof params.status === "string" && allowedStatuses.has(params.status) ? params.status : undefined

  // Pass directly to the Domain Service instead of making an HTTP fetch call
  // This is the power of Server Components.
  const { data, meta } = await MovieService.adminListMovies({
    skip,
    take,
    search,
    status,
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Movies</h1>
        <p className="text-muted-foreground">Manage your movie catalog, publish statuses, and details.</p>
      </div>

      <MoviesClientWrapper 
        data={data} 
        total={meta.total} 
        skip={meta.skip} 
        take={meta.take} 
      />
    </div>
  )
}
