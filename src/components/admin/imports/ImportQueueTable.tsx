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
import { Eye, Trash, Loader2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
  
  // Auto Processing State
  const [isAutoProcessing, setIsAutoProcessing] = React.useState(true)
  const [isCurrentlyFetching, setIsCurrentlyFetching] = React.useState(false)

  // Use a ref to strictly avoid overlapping loops across re-renders
  const autoProcessorRef = React.useRef({ isRunning: false, isCancelled: false })

  // Data fetching effect
  const fetchLatestJobs = async () => {
    try {
      const res = await fetch('/api/admin/imports')
      if (res.ok) {
        const data = await res.json()
        if (!autoProcessorRef.current.isCancelled) {
          setJobs(data.data.data)
        }
        return data.data.data
      }
    } catch (e) {
      // ignore
    }
    return null
  }

  // The continuous background processor loop
  React.useEffect(() => {
    if (!isAutoProcessing) {
      autoProcessorRef.current.isCancelled = true;
      return;
    }

    // Reset cancellation flag and start a fresh loop
    autoProcessorRef.current.isCancelled = false;

    // Guard: if a previous loop is still mid-fetch, let it exit naturally first
    if (autoProcessorRef.current.isRunning) return;

    autoProcessorRef.current.isRunning = true;

    const runProcessor = async () => {
      while (!autoProcessorRef.current.isCancelled) {
        setIsCurrentlyFetching(true);
        let processedCount = 0;
        try {
          // Hit the backend to process the queue. It will return the number of processed jobs.
          const res = await fetch('/api/admin/cron/process-imports', { method: 'POST' });
          if (res.ok) {
            const result = await res.json();
            processedCount = result.processed || 0;
          }
          await fetchLatestJobs(); // Update UI immediately after batch finishes
        } catch (e) {
          // Error, back off
          processedCount = 0;
        } finally {
          setIsCurrentlyFetching(false);
        }

        if (autoProcessorRef.current.isCancelled) break;

        if (processedCount > 0) {
          // Processed something, there might be more, wait a bit and poll again
          await new Promise(r => setTimeout(r, 2000));
        } else {
          // No pending jobs found anywhere in the DB, sleep longer
          await new Promise(r => setTimeout(r, 10000));
        }
      }
      autoProcessorRef.current.isRunning = false;
    };

    runProcessor();

    return () => {
      autoProcessorRef.current.isCancelled = true;
    };
  }, [isAutoProcessing]);

  const handleDelete = async () => {
    if (!deletingJobId) return
    try {
      const res = await fetch(`/api/admin/imports/${deletingJobId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      
      toast.success("Job removed successfully")
      // Use functional update to avoid stale closure — jobs may have been refreshed
      // by the background polling loop while the confirmation dialog was open.
      setJobs(prev => prev.filter(j => j.id !== deletingJobId))
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

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleProcessQueue = async () => {
    toast.promise(fetch('/api/admin/cron/process-imports', { method: 'POST' }).then(() => fetchLatestJobs()), {
      loading: 'Processing next batch...',
      success: 'Queue batch processed',
      error: 'Failed to process queue'
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg border">
        <div className="flex items-center space-x-3">
          <Switch 
            id="auto-process" 
            checked={isAutoProcessing} 
            onCheckedChange={setIsAutoProcessing} 
          />
          <Label htmlFor="auto-process" className="flex items-center gap-2 font-medium cursor-pointer">
            Auto-Process Queue
            {isAutoProcessing && isCurrentlyFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </Label>
        </div>
        <Button onClick={handleProcessQueue} variant="outline" disabled={isAutoProcessing}>
          Process Next Batch (Manual)
        </Button>
      </div>

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

