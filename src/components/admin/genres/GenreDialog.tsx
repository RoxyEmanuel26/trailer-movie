"use client"

import * as React from "react"
import { Genre } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

interface GenreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  genre: Genre | null
  onSuccess: (genre: Genre) => void
}

export function GenreDialog({ open, onOpenChange, genre, onSuccess }: GenreDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setName(genre?.name || "")
      setDescription(genre?.description || "")
    }
  }, [open, genre])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = genre ? `/api/admin/genres/${genre.id}` : `/api/admin/genres`
      const method = genre ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })

      const json = await res.json()
      
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to save genre")
      }

      toast.success("Genre saved successfully")
      onSuccess(json.data)
    } catch (err: any) {
      toast.error("Error", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{genre ? "Edit Genre" : "Add Genre"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
