"use client"

import * as React from "react"
import { Collection } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

interface CollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: Collection | null
  onSuccess: (collection: Collection) => void
}

export function CollectionDialog({ open, onOpenChange, collection, onSuccess }: CollectionDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isActive, setIsActive] = React.useState(false)
  const [isFeatured, setIsFeatured] = React.useState(false)
  const [coverImageUrl, setCoverImageUrl] = React.useState("")

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(collection?.title || "")
      setDescription(collection?.description || "")
      setIsActive(collection?.isActive ?? false)
      setIsFeatured(collection?.isFeatured ?? false)
      setCoverImageUrl(collection?.coverImageUrl || "")
    }
  }, [open, collection])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = collection ? `/api/admin/collections/${collection.id}` : `/api/admin/collections`
      const method = collection ? 'PUT' : 'POST'
      
      const payload = {
        title,
        description,
        isActive,
        isFeatured,
        coverImageUrl: coverImageUrl || null
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json()
      
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to save collection")
      }

      toast.success("Collection saved successfully")
      onSuccess(json.data)
    } catch (err: any) {
      toast.error("Error", { description: "Failed to save collection" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{collection ? "Edit Collection" : "Add Collection"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImageUrl">Cover Image URL</Label>
            <Input id="coverImageUrl" type="url" value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} />
          </div>

          <div className="flex gap-8 py-4">
            <div className="flex items-center space-x-2">
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="isActive">Active (Published)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
              <Label htmlFor="isFeatured">Featured</Label>
            </div>
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
