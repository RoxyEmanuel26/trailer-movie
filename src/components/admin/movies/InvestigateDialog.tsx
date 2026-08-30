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
import { Progress } from "@/components/ui/progress"

interface InvestigateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvestigateDialog({ open, onOpenChange }: InvestigateDialogProps) {
  const [stage, setStage] = React.useState<'idle' | 'scanning' | 'ready' | 'processing' | 'done'>('idle')
  const [missingMovies, setMissingMovies] = React.useState<any[]>([])
  const cancelRef = React.useRef(false)
  
  // Progress tracking
  const [progressCount, setProgressCount] = React.useState(0)
  const [results, setResults] = React.useState({ success: 0, skipped: 0, failed: 0 })

  React.useEffect(() => {
    if (open) {
      cancelRef.current = false
      setStage('idle')
      setMissingMovies([])
      setResults({ success: 0, skipped: 0, failed: 0 })
      setProgressCount(0)
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
    setProgressCount(0)
    
    let currentResults = { success: 0, skipped: 0, failed: 0 }
    
    // Process in chunks of 25 to prevent server timeouts while maintaining fast real-time progress
    const CHUNK_SIZE = 25;
    for (let i = 0; i < missingMovies.length; i += CHUNK_SIZE) {
      if (cancelRef.current) {
        toast.info("Investigasi dibatalkan.");
        break;
      }
      
      const chunk = missingMovies.slice(i, i + CHUNK_SIZE);
      const tmdbIds = chunk.map(m => m.tmdbId);
      
      try {
        const res = await fetch('/api/admin/movies/investigate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdbIds })
        })
        const data = await res.json()
        
        if (res.ok) {
          currentResults.success += data.data.success;
          currentResults.skipped += data.data.skipped;
          currentResults.failed += data.data.failed;
        } else {
          currentResults.failed += chunk.length;
        }
      } catch (e: any) {
        currentResults.failed += chunk.length;
      }
      
      setResults({ ...currentResults })
      setProgressCount(Math.min(i + CHUNK_SIZE, missingMovies.length))
    }
    
    setStage('done')
    toast.success("Investigation complete!")
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          cancelRef.current = true;
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent 
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => {
          if (stage === 'scanning' || stage === 'processing') {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (stage === 'scanning' || stage === 'processing') {
            e.preventDefault()
          }
        }}
      >
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
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Investigating...</span>
                  <span>{progressCount} / {missingMovies.length}</span>
                </div>
                <Progress value={(progressCount / missingMovies.length) * 100} />
              </div>
              <div className="flex justify-between w-full text-xs text-muted-foreground px-2">
                <span className="text-green-600">Updated: {results.success}</span>
                <span className="text-yellow-600">No Data: {results.skipped}</span>
                <span className="text-red-600">Failed: {results.failed}</span>
              </div>
            </>
          )}

          {stage === 'done' && (
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

