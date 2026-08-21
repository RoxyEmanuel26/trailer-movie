"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { Search, SearchCode } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { InvestigateDialog } from "./InvestigateDialog"

export function MoviesToolbar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchTerm, setSearchTerm] = React.useState(searchParams.get("search") || "")
  const [status, setStatus] = React.useState(searchParams.get("status") || "ALL")
  const [isInvestigateOpen, setIsInvestigateOpen] = React.useState(false)

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set("search", term)
    } else {
      params.delete("search")
    }
    params.set("skip", "0") // reset pagination
    router.push(`?${params.toString()}`)
  }, 300)

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    setStatus(newStatus)
    const params = new URLSearchParams(searchParams.toString())
    if (newStatus && newStatus !== "ALL") {
      params.set("status", newStatus)
    } else {
      params.delete("status")
    }
    params.set("skip", "0") // reset pagination
    router.push(`?${params.toString()}`)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter movies..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                handleSearch(e.target.value)
              }}
            />
          </div>
          <select 
            className="flex h-10 w-full max-w-[150px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={status}
            onChange={handleStatusChange}
          >
            <option value="ALL">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="secondary" onClick={() => setIsInvestigateOpen(true)}>
            <SearchCode className="w-4 h-4 mr-2" />
            Investigate Missing Data
          </Button>
        </div>
      </div>

      <InvestigateDialog 
        open={isInvestigateOpen} 
        onOpenChange={setIsInvestigateOpen} 
      />
    </>
  )
}

