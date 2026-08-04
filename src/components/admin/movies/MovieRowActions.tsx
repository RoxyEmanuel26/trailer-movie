"use client"

import * as React from "react"
import { MoreHorizontal, Edit, Trash, Globe, Archive } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmationDialog } from "@/components/admin/global/ConfirmationDialog"

interface Movie {
  id: string
  title: string
  status: string
}

interface MovieRowActionsProps {
  movie: Movie
  onEdit: (movie: Movie) => void
}

export function MovieRowActions({ movie, onEdit }: MovieRowActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleStatusChange = async (newStatus: "PUBLISHED" | "ARCHIVED") => {
    try {
      const res = await fetch(`/api/admin/movies/${movie.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      toast.success(`Movie marked as ${newStatus}`)
      router.refresh()
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/movies/${movie.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete movie")
      toast.success("Movie deleted")
      setShowDeleteDialog(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete movie")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(movie)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {movie.status !== "PUBLISHED" && (
            <DropdownMenuItem onClick={() => handleStatusChange("PUBLISHED")}>
              <Globe className="mr-2 h-4 w-4" />
              Publish
            </DropdownMenuItem>
          )}
          {movie.status !== "ARCHIVED" && (
            <DropdownMenuItem onClick={() => handleStatusChange("ARCHIVED")}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Movie"
        description={`Are you sure you want to delete "${movie.title}"? This will soft-delete the record.`}
        onConfirm={handleDelete}
        isDestructive
        isLoading={isDeleting}
      />
    </>
  )
}
