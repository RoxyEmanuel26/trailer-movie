"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ArrowUp, ArrowDown, Edit, Trash } from "lucide-react"
import { useDebounce } from "use-debounce"

export function FeaturedHeroClient({ initialData }: { initialData: any[] }) {
  const router = useRouter()
  const [items, setItems] = React.useState(initialData)
  const [isAddOpen, setIsAddOpen] = React.useState(false)

  // Sync state if initialData changes (e.g. on router.refresh)
  React.useEffect(() => {
    setItems(initialData)
  }, [initialData])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this featured item?")) return
    try {
      const res = await fetch(`/api/admin/homepage/featured/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Item removed")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === items.length - 1) return

    const newItems = [...items]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newItems[index]
    newItems[index] = newItems[swapIndex]
    newItems[swapIndex] = temp

    setItems(newItems)

    try {
      const orderedIds = newItems.map((i) => i.id)
      const res = await fetch("/api/admin/homepage/featured/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds })
      })
      if (!res.ok) throw new Error("Failed to reorder")
      toast.success("Order updated")
    } catch (err: any) {
      toast.error(err.message)
      setItems(initialData) // revert on error
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Featured Hero</CardTitle>
          <p className="text-sm text-muted-foreground">Manage the movies displayed in the hero carousel.</p>
        </div>
        <AddFeaturedItemDialog 
          open={isAddOpen} 
          onOpenChange={setIsAddOpen} 
          onSuccess={() => {
            setIsAddOpen(false)
            router.refresh()
          }} 
        />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md border-dashed">
            No featured items yet. Add one to show in the hero.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Order</TableHead>
                <TableHead>Movie</TableHead>
                <TableHead>Custom Headline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.movie?.title}
                  </TableCell>
                  <TableCell>{item.customHeadline || "-"}</TableCell>
                  <TableCell>
                    {item.isActive ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function AddFeaturedItemDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const [movieId, setMovieId] = React.useState("")
  const [customHeadline, setCustomHeadline] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [debouncedSearch] = useDebounce(searchQuery, 500)
  const [isSearching, setIsSearching] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([])
      return
    }
    const search = async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/admin/movies?query=${encodeURIComponent(debouncedSearch)}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.data || [])
        }
      } catch (err) {
        console.error("Search failed", err)
      } finally {
        setIsSearching(false)
      }
    }
    search()
  }, [debouncedSearch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!movieId) {
      toast.error("Please select a movie")
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/homepage/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          customHeadline: customHeadline || null,
          isActive: true
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || "Failed to add")
      }
      toast.success("Featured item added")
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Add Featured Item</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Featured Item</DialogTitle>
            <DialogDescription>Select a movie to feature in the hero section.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search Movie</Label>
              <Input 
                placeholder="Type to search movies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && <div className="text-sm text-muted-foreground">Searching...</div>}
              {searchResults.length > 0 && (
                <div className="max-h-[150px] overflow-y-auto border rounded-md p-2 space-y-1">
                  {searchResults.map((m) => (
                    <div 
                      key={m.id}
                      className={`p-2 text-sm rounded-md cursor-pointer ${movieId === m.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                      onClick={() => setMovieId(m.id)}
                    >
                      {m.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Selected Movie ID</Label>
              <Input value={movieId} readOnly placeholder="Select a movie above..." />
            </div>
            <div className="space-y-2">
              <Label>Custom Headline (Optional)</Label>
              <Input 
                value={customHeadline} 
                onChange={(e) => setCustomHeadline(e.target.value)} 
                placeholder="Override movie title..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving || !movieId}>
              {isSaving ? "Saving..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
