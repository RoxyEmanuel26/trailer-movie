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

interface ImportJobDetailsDialogProps {
  job: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportJobDetailsDialog({
  job,
  open,
  onOpenChange,
}: ImportJobDetailsDialogProps) {
  if (!job) return null

  // The tracker saves state in the 'logs' field as a JSON object
  const state = job.logs as any
  const percentage = state?.percentage || 0
  const steps = state?.steps || []
  const currentStep = state?.currentStep || "Initializing"
  const error = state?.error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Job Details</DialogTitle>
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
              <span className="text-muted-foreground">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm font-mono">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Execution Log</h4>
            <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/50 p-4 font-mono text-xs">
              {steps.length > 0 ? (
                <ul className="space-y-1">
                  {steps.map((step: any, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted-foreground whitespace-nowrap">
                        [{new Date(step.timestamp).toISOString().split('T')[1].slice(0, -1)}]
                      </span>
                      <span>{step.message}</span>
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
