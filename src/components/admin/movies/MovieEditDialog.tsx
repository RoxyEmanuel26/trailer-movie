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
  const [lockedFields, setLockedFields] = React.useState<string[]>([])
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (movie) {
      setTitle(movie.title)
      setLockedFields(movie.lockedFields || [])
    }
  }, [movie])

  const handleSave = async () => {
    if (!movie) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/movies/${movie.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
