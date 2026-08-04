"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import { extractYouTubeId } from "@/lib/utils/youtube"

export function MovieEditDialog({
  movie,
  open,
  onOpenChange,
}: {
  movie: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [title, setTitle] = React.useState("")
  const [youtubeTrailerId, setYoutubeTrailerId] = React.useState("")
  const [lockedFields, setLockedFields] = React.useState<string[]>([])
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (movie) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(movie.title)
      setYoutubeTrailerId(movie.youtubeTrailerId || "")
      setLockedFields(movie.lockedFields || [])
    }
  }, [movie])

  const handleYoutubeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // If they paste a full URL, extract the ID. Otherwise allow them to type.
    const extracted = extractYouTubeId(val)
    setYoutubeTrailerId(extracted || val)
  }

  const handleSave = async () => {
    if (!movie) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/movies/${movie.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          youtubeTrailerId: youtubeTrailerId || null,
          lockedFields 
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Movie updated successfully")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error("An error occurred while saving")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleLock = (field: string) => {
    setLockedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    )
  }

  if (!movie) return null

  // If the youtubeTrailerId is exactly 11 chars, we assume it's a valid ID for preview
  const isValidPreview = youtubeTrailerId && youtubeTrailerId.length === 11

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Movie: {movie.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Movie Title"
            />
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">YouTube Trailer</label>
            <Input
              value={youtubeTrailerId}
              onChange={handleYoutubeChange}
              placeholder="Paste YouTube URL or Video ID"
            />
            {isValidPreview && (
              <div className="mt-2 aspect-video overflow-hidden rounded-md border bg-muted">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube-nocookie.com/embed/${youtubeTrailerId}?rel=0&modestbranding=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
            {!isValidPreview && youtubeTrailerId.length > 0 && (
              <p className="text-sm text-destructive">Invalid YouTube ID or URL.</p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Locked Fields (Prevent TMDB Overwrite)</label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="lock-title" 
                checked={lockedFields.includes("title")} 
                onCheckedChange={() => toggleLock("title")}
              />
              <label htmlFor="lock-title" className="text-sm font-medium leading-none">Title</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="lock-synopsis" 
                checked={lockedFields.includes("synopsis")} 
                onCheckedChange={() => toggleLock("synopsis")}
              />
              <label htmlFor="lock-synopsis" className="text-sm font-medium leading-none">Synopsis</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="lock-trailers" 
                checked={lockedFields.includes("trailers")} 
                onCheckedChange={() => toggleLock("trailers")}
              />
              <label htmlFor="lock-trailers" className="text-sm font-medium leading-none">Trailers</label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
