"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"

interface ImportJobDetailsDialogProps {
  job: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRetry?: (id: string) => Promise<void>
}

export function ImportJobDetailsDialog({
  job,
  open,
  onOpenChange,
  onRetry,
}: ImportJobDetailsDialogProps) {
  if (!job) return null

  // The tracker saves ProgressState in the 'logs' field as a JSON object.
  // Shape: { stage, progress, logs: string[], retryCount, startedAt, finishedAt, durationMs }
  const state = job.logs as any
  const percentage = state?.progress || 0
  const steps = Array.isArray(state?.logs) ? state.logs : []
  const currentStep = state?.stage || 'Initializing'
  const retryCount = state?.retryCount || 0
  const durationMs = state?.durationMs

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-6">
          <DialogTitle>Import Job Details</DialogTitle>
          {job.status === "FAILED" && onRetry && (
            <Button
              size="sm"
              variant="outline"
              className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              onClick={async () => {
                await onRetry(job.id)
                onOpenChange(false)
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Retry Job
            </Button>
          )}
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Job ID:</span>
              <p className="font-mono">{job.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">TMDB ID:</span>
              <p className="font-medium">{job.tmdbId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium">{job.status}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p>{new Date(job.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{currentStep}</span>
              <div className="flex gap-3 text-muted-foreground">
                {retryCount > 0 && <span>Retries: {retryCount}</span>}
                {durationMs && <span>{(durationMs / 1000).toFixed(1)}s</span>}
                <span>{percentage}%</span>
              </div>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Execution Log</h4>
            <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/50 p-4 font-mono text-xs">
              {steps.length > 0 ? (
                <ul className="space-y-1">
                  {steps.map((logLine: string, i: number) => (
                    <li key={i} className="leading-relaxed">
                      {logLine}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted-foreground">No logs available yet...</div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
