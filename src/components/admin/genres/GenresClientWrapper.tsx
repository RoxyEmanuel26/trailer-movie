"use client"

import * as React from "react"
import { DataTable } from "@/components/admin/DataTable"
import { ColumnDef } from "@tanstack/react-table"
import { Genre } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/components/admin/global/ConfirmationDialog"
import { GenreDialog } from "./GenreDialog"

export function GenresClientWrapper({ initialData }: { initialData: Genre[] }) {
  const router = useRouter()
  const [data, setData] = React.useState(initialData)
  const [isPending, startTransition] = React.useTransition()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingGenre, setEditingGenre] = React.useState<Genre | null>(null)
  
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const columns: ColumnDef<Genre>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "slug", header: "Slug" },
    { accessorKey: "description", header: "Description" },
    {
      id: "actions",
      cell: ({ row }) => {
        const genre = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => {
              setEditingGenre(genre)
              setDialogOpen(true)
            }}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(genre.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )
      }
    }
  ]

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/genres/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error("Failed to delete")
      
      setData(prev => prev.filter(g => g.id !== deleteId))
      toast.success("Genre deleted successfully")
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error("Error", { description: "Failed to delete genre" })
    } finally {
      setDeleteId(null)
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const res = await fetch(`/api/admin/genres/bulk`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      if (!res.ok) throw new Error("Failed to delete")
      
      setData(prev => prev.filter(g => !ids.includes(g.id)))
      toast.success(`${ids.length} genres deleted successfully`)
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error("Error", { description: "Failed to delete genres" })
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">All Genres</h2>
        <Button onClick={() => { setEditingGenre(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Genre
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        onDeleteSelected={handleBulkDelete}
      />

      <GenreDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        genre={editingGenre} 
        onSuccess={(updatedGenre) => {
          if (editingGenre) {
            setData(prev => prev.map(g => g.id === updatedGenre.id ? updatedGenre : g))
          } else {
            setData(prev => [...prev, updatedGenre])
          }
          setDialogOpen(false)
          startTransition(() => router.refresh())
        }}
      />

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Genre"
        description="Are you sure you want to delete this genre? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  )
}
