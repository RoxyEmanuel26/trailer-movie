"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { toast } from "sonner"
import { Eye, Trash } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { ConfirmationDialog } from "@/components/admin/global/ConfirmationDialog"
import { ImportJobDetailsDialog } from "./ImportJobDetailsDialog"

interface ImportQueueTableProps {
  initialJobs: any[]
}

export function ImportQueueTable({ initialJobs }: ImportQueueTableProps) {
  const [jobs, setJobs] = React.useState(initialJobs)
  const [selectedJob, setSelectedJob] = React.useState<any | null>(null)
  const [deletingJobId, setDeletingJobId] = React.useState<string | null>(null)

  // Auto-refresh the jobs queue every 5 seconds if there are pending/in_progress jobs
  React.useEffect(() => {
    const hasActiveJobs = jobs.some(j => j.status === 'PENDING' || j.status === 'IN_PROGRESS')
    if (!hasActiveJobs) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/imports')
        if (res.ok) {
          const data = await res.json()
          setJobs(data.data.data) // data -> successResponse.data -> paginated.data
        }
      } catch (e) {
        // ignore
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [jobs])

  const handleDelete = async () => {
    if (!deletingJobId) return
    try {
      const res = await fetch(`/api/admin/imports/${deletingJobId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      
      toast.success("Job removed successfully")
      setJobs(jobs.filter(j => j.id !== deletingJobId))
    } catch (error) {
      toast.error("Failed to remove job")
    } finally {
      setDeletingJobId(null)
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "tmdbId",
      header: "TMDB ID",
      cell: ({ row }) => <div className="font-medium">{row.getValue("tmdbId")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => format(new Date(row.getValue("createdAt")), "PP p"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const job = row.original
        const canDelete = job.status !== "IN_PROGRESS"

        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedJob(job)}>
              <Eye className="h-4 w-4 mr-2" />
              Details
            </Button>
            {canDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setDeletingJobId(job.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No import jobs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ImportJobDetailsDialog
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={(open) => !open && setSelectedJob(null)}
      />

      <ConfirmationDialog
        open={!!deletingJobId}
        onOpenChange={(open) => !open && setDeletingJobId(null)}
        title="Remove Job"
        description="Are you sure you want to remove this job record? This action cannot be undone."
        onConfirm={handleDelete}
        isDestructive
      />
    </div>
  )
}
