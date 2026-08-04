"use client"

import * as React from "react"
import { Tag } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

interface TagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag: Tag | null
  onSuccess: (tag: Tag) => void
}

export function TagDialog({ open, onOpenChange, tag, onSuccess }: TagDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setName(tag?.name || "")
    }
  }, [open, tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = tag ? `/api/admin/tags/${tag.id}` : `/api/admin/tags`
      const method = tag ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })

      const json = await res.json()
      
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to save tag")
      }

      toast.success("Tag saved successfully")
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
          <DialogTitle>{tag ? "Edit Tag" : "Add Tag"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
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
