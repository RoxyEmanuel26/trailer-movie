"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

import { ArrowUp, ArrowDown, Trash } from "lucide-react"
import { useDebounce } from "use-debounce"

export function HomepageSectionsClient({ initialData }: { initialData: any[] }) {
  const router = useRouter()
  const [items, setItems] = React.useState(initialData)
  const [isAddOpen, setIsAddOpen] = React.useState(false)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(initialData)
  }, [initialData])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this section?")) return
    try {
      const res = await fetch(`/api/admin/homepage/sections/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Section removed")
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
      const res = await fetch("/api/admin/homepage/sections/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds })
      })
      if (!res.ok) throw new Error("Failed to reorder")
      toast.success("Order updated")
    } catch (err: any) {
      toast.error(err.message)
      setItems(initialData) 
    }
  }

  const formatType = (type: string) => type.replace(/_/g, " ")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Homepage Sections</CardTitle>
          <p className="text-sm text-muted-foreground">Manage the content blocks shown on the homepage.</p>
        </div>
        <AddSectionDialog 
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
            No sections added yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Linked Entity</TableHead>
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
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{formatType(item.type)}</TableCell>
                  <TableCell>
                    {item.collection && <span className="text-sm border rounded px-2 py-1 bg-muted">Collection: {item.collection.title}</span>}
                    {item.genre && <span className="text-sm border rounded px-2 py-1 bg-muted">Genre: {item.genre.name}</span>}
                    {!item.collection && !item.genre && "-"}
                  </TableCell>
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

function AddSectionDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const [title, setTitle] = React.useState("")
  const [type, setType] = React.useState("AUTO_RECENT")
  const [collectionId, setCollectionId] = React.useState<string | null>(null)
  const [genreId, setGenreId] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  // Quick entity search 
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [debouncedSearch] = useDebounce(searchQuery, 500)
  const [isSearching, setIsSearching] = React.useState(false)

  React.useEffect(() => {
    if (!debouncedSearch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([])
      return
    }
    const search = async () => {
      setIsSearching(true)
      try {
        const endpoint = type === 'MANUAL_COLLECTION' ? `/api/admin/collections?search=${encodeURIComponent(debouncedSearch)}` : `/api/admin/genres?search=${encodeURIComponent(debouncedSearch)}`
        const res = await fetch(endpoint)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.data?.items || data.data || [])
        }
      } catch (err) {
        console.error("Search failed", err)
      } finally {
        setIsSearching(false)
      }
    }
    if (type === 'MANUAL_COLLECTION' || type === 'GENRE_BASED') {
      search()
    }
  }, [debouncedSearch, type])

  // Reset fields when type changes
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollectionId(null)
    setGenreId(null)
    setSearchQuery("")
    setSearchResults([])
  }, [type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) {
      toast.error("Please enter a title")
      return
    }
    if (type === 'MANUAL_COLLECTION' && !collectionId) {
      toast.error("Please select a collection")
      return
    }
    if (type === 'GENRE_BASED' && !genreId) {
      toast.error("Please select a genre")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/homepage/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          collectionId,
          genreId,
          isActive: true
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || "Failed to add")
      }
      toast.success("Section added")
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const needsEntitySearch = type === 'MANUAL_COLLECTION' || type === 'GENRE_BASED'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Add Section</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Homepage Section</DialogTitle>
            <DialogDescription>Create a new block for the homepage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Action Movies, New Releases"
              />
            </div>
            <div className="space-y-2">
              <Label>Section Type</Label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="AUTO_RECENT">Latest (Recent)</option>
                <option value="AUTO_UPCOMING">Upcoming</option>
                <option value="AUTO_TRENDING">Trending (Popular)</option>
                <option value="MANUAL_COLLECTION">Collection Based</option>
                <option value="GENRE_BASED">Genre Based</option>
                <option value="AD_SLOT">Advertisement</option>
              </select>
            </div>

            {needsEntitySearch && (
              <div className="space-y-2 border p-3 rounded-md bg-muted/30">
                <Label>Search {type === 'MANUAL_COLLECTION' ? 'Collection' : 'Genre'}</Label>
                <Input 
                  placeholder={`Type to search...`} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && <div className="text-sm text-muted-foreground">Searching...</div>}
                {searchResults.length > 0 && (
                  <div className="max-h-[150px] overflow-y-auto border rounded-md p-2 space-y-1 bg-background">
                    {searchResults.map((item) => {
                      const isSelected = type === 'MANUAL_COLLECTION' ? collectionId === item.id : genreId === item.id
                      return (
                        <div 
                          key={item.id}
                          className={`p-2 text-sm rounded-md cursor-pointer ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                          onClick={() => {
                            if (type === 'MANUAL_COLLECTION') setCollectionId(item.id)
                            else setGenreId(item.id)
                          }}
                        >
                          {item.title || item.name}
                        </div>
                      )
                    })}
                  </div>
                )}
                {(collectionId || genreId) && (
                  <div className="text-sm mt-2 text-green-600 font-medium">✓ Item selected</div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Add Section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
