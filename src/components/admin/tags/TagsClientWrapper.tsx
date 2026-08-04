"use client"

import * as React from "react"
import { DataTable } from "@/components/admin/DataTable"
import { ColumnDef } from "@tanstack/react-table"
import { Tag } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/components/admin/global/ConfirmationDialog"
import { TagDialog } from "./TagDialog"

export function TagsClientWrapper({ initialData }: { initialData: Tag[] }) {
  const router = useRouter()
  const [data, setData] = React.useState(initialData)
  const [isPending, startTransition] = React.useTransition()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingTag, setEditingTag] = React.useState<Tag | null>(null)
  
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const columns: ColumnDef<Tag>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "slug", header: "Slug" },
    {
      id: "actions",
      cell: ({ row }) => {
        const tag = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => {
              setEditingTag(tag)
              setDialogOpen(true)
            }}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(tag.id)}>
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
      const res = await fetch(`/api/admin/tags/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error("Failed to delete")
      
      setData(prev => prev.filter(t => t.id !== deleteId))
      toast.success("Tag deleted successfully")
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error("Error", { description: "Failed to delete tag" })
    } finally {
      setDeleteId(null)
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const res = await fetch(`/api/admin/tags/bulk`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      if (!res.ok) throw new Error("Failed to delete")
      
      setData(prev => prev.filter(t => !ids.includes(t.id)))
      toast.success(`${ids.length} tags deleted successfully`)
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error("Error", { description: "Failed to delete tags" })
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">All Tags</h2>
        <Button onClick={() => { setEditingTag(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Tag
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        onDeleteSelected={handleBulkDelete}
      />

      <TagDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        tag={editingTag} 
        onSuccess={(updatedTag) => {
          if (editingTag) {
            setData(prev => prev.map(t => t.id === updatedTag.id ? updatedTag : t))
          } else {
            setData(prev => [...prev, updatedTag])
          }
          setDialogOpen(false)
          startTransition(() => router.refresh())
        }}
      />

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Tag"
        description="Are you sure you want to delete this tag? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  )
}
