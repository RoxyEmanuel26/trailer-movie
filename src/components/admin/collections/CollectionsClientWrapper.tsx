"use client"

import * as React from "react"
import { DataTable } from "@/components/admin/DataTable"
import { ColumnDef } from "@tanstack/react-table"
import { Collection } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/components/admin/global/ConfirmationDialog"
import { CollectionDialog } from "./CollectionDialog"
import Link from "next/link"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { Badge } from "@/components/ui/badge"

export function CollectionsClientWrapper({ initialData }: { initialData: Collection[] }) {
  const router = useRouter()
  const [data, setData] = React.useState(initialData)
  const [isPending, startTransition] = React.useTransition()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingCollection, setEditingCollection] = React.useState<Collection | null>(null)
  
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const columns: ColumnDef<Collection>[] = [
    { accessorKey: "title", header: "Title" },
    { accessorKey: "slug", header: "Slug" },
    { 
      accessorKey: "isActive", 
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.isActive ? "PUBLISHED" : "DRAFT"} />
    },
    { 
      accessorKey: "isFeatured", 
      header: "Featured",
      cell: ({ row }) => row.original.isFeatured ? <Badge variant="default">Featured</Badge> : <Badge variant="outline">No</Badge>
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const collection = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/admin/collections/${collection.id}`}>
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => {
              setEditingCollection(collection)
              setDialogOpen(true)
            }}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(collection.id)}>
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
      const res = await fetch(`/api/admin/collections/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error("Failed to delete")
      
      setData(prev => prev.filter(c => c.id !== deleteId))
      toast.success("Collection deleted successfully")
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error("Error", { description: "Failed to delete collection" })
    } finally {
      setDeleteId(null)
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const res = await fetch(`/api/admin/collections/bulk`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      if (!res.ok) throw new Error("Failed to delete")
      
      setData(prev => prev.filter(c => !ids.includes(c.id)))
      toast.success(`${ids.length} collections deleted successfully`)
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error("Error", { description: "Failed to delete collections" })
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">All Collections</h2>
        <Button onClick={() => { setEditingCollection(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Collection
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="title"
        onDeleteSelected={handleBulkDelete}
      />

      <CollectionDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        collection={editingCollection} 
        onSuccess={(updatedCollection) => {
          if (editingCollection) {
            setData(prev => prev.map(c => c.id === updatedCollection.id ? updatedCollection : c))
          } else {
            setData(prev => [...prev, updatedCollection])
          }
          setDialogOpen(false)
          startTransition(() => router.refresh())
        }}
      />

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Collection"
        description="Are you sure you want to delete this collection? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  )
}
