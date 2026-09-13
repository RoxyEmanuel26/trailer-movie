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
import { Eye, Trash, Loader2, RotateCcw, Square } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { ConfirmationDialog } from "@/components/admin/global/ConfirmationDialog"
import { ImportJobDetailsDialog } from "./ImportJobDetailsDialog"

interface ImportQueueTableProps {
  initialJobs: any[]
}

type DrainProgress = {
  cycles: number
  claimed: number
  completed: number
  partial: number
  failed: number
  remaining: number | null
  readyRemaining: number | null
}

const initialDrainProgress: DrainProgress = {
  cycles: 0,
  claimed: 0,
  completed: 0,
  partial: 0,
  failed: 0,
  remaining: null,
  readyRemaining: null,
}

export function ImportQueueTable({ initialJobs }: ImportQueueTableProps) {
  const [jobs, setJobs] = React.useState(initialJobs)
  const [selectedJob, setSelectedJob] = React.useState<any | null>(null)
  const [deletingJobId, setDeletingJobId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  
  const [isCurrentlyFetching, setIsCurrentlyFetching] = React.useState(false)
  const [drainProgress, setDrainProgress] = React.useState<DrainProgress>(initialDrainProgress)
  const stopRequestedRef = React.useRef(false)
  const activeRequestRef = React.useRef<AbortController | null>(null)
  const [retryingJobIds, setRetryingJobIds] = React.useState<Set<string>>(new Set())
  const [isRetryingAll, setIsRetryingAll] = React.useState(false)

  const failedJobsCount = React.useMemo(() => {
    return jobs.filter((j: any) => ['FAILED', 'PARTIAL'].includes(j.status) && j.retryable).length
  }, [jobs])

  const handleRetrySingle = async (id: string) => {
    setRetryingJobIds(prev => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/admin/imports/${id}/retry`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to retry')
      toast.success("Job queued for retry")
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'PENDING' } : j))
      await fetchLatestJobs()
    } catch (e) {
      toast.error("Failed to retry job")
    } finally {
      setRetryingJobIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleRetryAll = async () => {
    setIsRetryingAll(true)
    try {
      const res = await fetch('/api/admin/imports/retry-all', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to retry all')
      const data = await res.json()
      toast.success(data?.data?.message || "All failed jobs queued for retry")
      setJobs(prev => prev.map(j => ['FAILED', 'PARTIAL'].includes(j.status) && j.retryable ? { ...j, status: 'PENDING' } : j))
      await fetchLatestJobs()
    } catch (e) {
      toast.error("Failed to retry all failed jobs")
    } finally {
      setIsRetryingAll(false)
    }
  }

  const fetchLatestJobs = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/imports')
      if (res.ok) {
        const data = await res.json()
        setJobs(data.data.data)
        return data.data.data
      }
    } catch (e) {
      // ignore
    }
    return null
  }, [])

  React.useEffect(() => {
    const interval = window.setInterval(() => void fetchLatestJobs(), 5000)
    return () => window.clearInterval(interval)
  }, [fetchLatestJobs])

  React.useEffect(() => () => {
    stopRequestedRef.current = true
    activeRequestRef.current?.abort()
  }, [])

  const handleDelete = async () => {
    if (!deletingJobId || isDeleting) return
    setIsDeleting(true)
    const targetId = deletingJobId
    try {
      const res = await fetch(`/api/admin/imports/${targetId}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 404) throw new Error()
      
      toast.success("Job removed successfully")
      // Use functional update to avoid stale closure — jobs may have been refreshed
      // by the background polling loop while the confirmation dialog was open.
      setJobs(prev => prev.filter(j => j.id !== targetId))
    } catch (error) {
      toast.error("Failed to remove job")
    } finally {
      setIsDeleting(false)
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
    { accessorKey: "entityType", header: "Type" },
    {
      accessorKey: "stage",
      header: "Progress",
      cell: ({ row }) => <div className="min-w-32"><div className="mb-1 flex justify-between text-xs"><span>{row.original.stage}</span><span>{row.original.progress}%</span></div><Progress value={row.original.progress} className="h-1.5" /></div>,
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
        const isFailed = ["FAILED", "PARTIAL"].includes(job.status) && job.retryable
        const isRetrying = retryingJobIds.has(job.id)

        return (
          <div className="flex items-center justify-end gap-2">
            {isFailed && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                onClick={() => handleRetrySingle(job.id)}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-1" />
                )}
                Retry
              </Button>
            )}
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
    if (isCurrentlyFetching) return
    setIsCurrentlyFetching(true)
    stopRequestedRef.current = false
    setDrainProgress(initialDrainProgress)
    toast.info('Queue processing started. It will continue automatically while this page stays open.')

    let noProgressCycles = 0
    try {
      while (!stopRequestedRef.current) {
        const controller = new AbortController()
        activeRequestRef.current = controller
        const response = await fetch('/api/admin/cron/process-imports', {
          method: 'POST',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Worker request failed')
        const summary = await response.json()

        setDrainProgress((current) => ({
          cycles: current.cycles + 1,
          claimed: current.claimed + Number(summary.claimed || 0),
          completed: current.completed + Number(summary.completed || 0),
          partial: current.partial + Number(summary.partial || 0),
          failed: current.failed + Number(summary.failed || 0),
          remaining: Number(summary.remaining || 0),
          readyRemaining: Number(summary.readyRemaining || 0),
        }))
        await fetchLatestJobs()

        if (!summary.busy && Number(summary.readyRemaining || 0) === 0) {
          if (Number(summary.remaining || 0) > 0) {
            toast.info(`${summary.remaining} job remain deferred for a scheduled retry.`)
          } else {
            toast.success('All pending import jobs have been processed.')
          }
          break
        }

        noProgressCycles = Number(summary.claimed || 0) === 0 ? noProgressCycles + 1 : 0
        if (noProgressCycles >= 40) {
          throw new Error('Queue made no progress after several attempts. Please try again shortly.')
        }
        await new Promise((resolve) => window.setTimeout(resolve, summary.busy ? 1500 : 400))
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        toast.info('Queue processing stopped. Pending jobs are safe and can be resumed.')
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to process queue')
      }
    } finally {
      activeRequestRef.current = null
      setIsCurrentlyFetching(false)
      await fetchLatestJobs()
    }
  }

  const stopProcessingQueue = () => {
    stopRequestedRef.current = true
    activeRequestRef.current?.abort()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 rounded-lg border bg-muted/50 p-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-medium">Persistent database worker</p>
          <p className="text-sm text-muted-foreground">Process All continues automatically until every currently eligible job is finished.</p>
          {isCurrentlyFetching && (
            <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
              {drainProgress.claimed} claimed · {drainProgress.completed} completed · {drainProgress.partial} partial · {drainProgress.failed} failed
              {drainProgress.remaining !== null ? ` · ${drainProgress.remaining} remaining` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {failedJobsCount > 0 && (
            <Button 
              onClick={handleRetryAll} 
              variant="outline" 
              className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              disabled={isRetryingAll}
            >
              {isRetryingAll ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Retry Eligible ({failedJobsCount})
            </Button>
          )}
          {isCurrentlyFetching ? (
            <Button onClick={stopProcessingQueue} variant="outline">
              <Square className="mr-2 h-4 w-4" /> Stop
            </Button>
          ) : (
            <Button onClick={handleProcessQueue} variant="outline">
              Process All Pending
            </Button>
          )}
        </div>
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
        onRetry={handleRetrySingle}
      />

      <ConfirmationDialog
        open={!!deletingJobId}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setDeletingJobId(null)
          }
        }}
        title="Remove Job"
        description="Are you sure you want to remove this job record? This action cannot be undone."
        onConfirm={handleDelete}
        isLoading={isDeleting}
        isDestructive
      />
    </div>
  )
}
