"use client"

import * as React from "react"
import { Loader2, Search, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface InvestigateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvestigateDialog({ open, onOpenChange }: InvestigateDialogProps) {
  const [stage, setStage] = React.useState<'idle' | 'scanning' | 'ready' | 'processing' | 'done'>('idle')
  const [missingMovies, setMissingMovies] = React.useState<any[]>([])
  const [results, setResults] = React.useState<any>(null)

  // Reset state when opened
  React.useEffect(() => {
    if (open) {
      setStage('idle')
      setMissingMovies([])
      setResults(null)
    }
  }, [open])

  const handleScan = async () => {
    setStage('scanning')
    try {
      const res = await fetch('/api/admin/movies/investigate')
      const data = await res.json()
      if (res.ok) {
        setMissingMovies(data.data)
        setStage('ready')
      } else {
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to scan database")
      setStage('idle')
    }
  }

  const handleFix = async () => {
    setStage('processing')
    try {
      const res = await fetch('/api/admin/movies/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbIds: missingMovies.map(m => m.tmdbId) })
      })
      const data = await res.json()
      if (res.ok) {
        setResults(data.data)
        setStage('done')
        toast.success("Investigation complete!")
      } else {
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to process missing data")
      setStage('ready')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Investigate Missing Data</DialogTitle>
          <DialogDescription>
            Scan your database for movies with missing posters or information, and check TMDB to see if they have been updated.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 gap-6 text-center">
          
          {stage === 'idle' && (
            <>
              <Search className="w-12 h-12 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Click below to scan your entire database for incomplete movies.
              </p>
              <Button onClick={handleScan} className="w-full">Start Scan</Button>
            </>
          )}

          {stage === 'scanning' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Scanning database...</p>
            </>
          )}

          {stage === 'ready' && (
            <>
              {missingMovies.length > 0 ? (
                <>
                  <AlertCircle className="w-12 h-12 text-yellow-500" />
                  <p className="text-sm font-medium">
                    Found {missingMovies.length} movies with missing posters or data.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    We will now interrogate the TMDB API twice for each movie to see if they finally uploaded the posters.
                  </p>
                  <Button onClick={handleFix} className="w-full">
                    Begin Investigation & Resync
                  </Button>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <p className="text-sm font-medium">Your database is perfect!</p>
                  <p className="text-xs text-muted-foreground">
                    No movies with missing data were found.
                  </p>
                  <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
                    Close
                  </Button>
                </>
              )}
            </>
          )}

          {stage === 'processing' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm font-medium">Investigating & Resyncing...</p>
              <p className="text-xs text-muted-foreground">
                Querying TMDB API and double-checking responses. This may take a while.
              </p>
            </>
          )}

          {stage === 'done' && results && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="text-sm font-medium">Investigation Complete</p>
              <div className="flex flex-col gap-2 text-sm text-left bg-muted/50 p-4 rounded-md w-full">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Successfully updated:</span>
                  <span className="font-bold text-green-600">{results.success}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Still no data on TMDB:</span>
                  <span className="font-bold text-yellow-600">{results.skipped}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed to process:</span>
                  <span className="font-bold text-red-600">{results.failed}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic mt-2">
                * Note: Movies that still have no data on TMDB will remain without posters until TMDB community uploads them.
              </p>
              <Button onClick={() => {
                onOpenChange(false);
                window.location.reload();
              }} className="w-full">
                Done & Refresh
              </Button>
            </>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
