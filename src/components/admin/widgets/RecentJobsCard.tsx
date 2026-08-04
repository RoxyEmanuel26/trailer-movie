import * as React from "react"
import { Badge } from "@/components/ui/badge"

export function RecentJobsCard() {
  const mockJobs = [
    { id: "job-1", name: "Inception Sync", status: "COMPLETED", time: "2m ago" },
    { id: "job-2", name: "Interstellar Sync", status: "FAILED", time: "10m ago" },
    { id: "job-3", name: "Dunkirk Sync", status: "IN_PROGRESS", time: "Just now" },
  ]

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6 pb-4">
        <h3 className="font-semibold leading-none tracking-tight">Recent Background Jobs</h3>
      </div>
      <div className="px-6 pb-6">
        <div className="space-y-4">
          {mockJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">{job.name}</span>
                <span className="text-xs text-muted-foreground">{job.time}</span>
              </div>
              <Badge 
                variant={job.status === "COMPLETED" ? "default" : job.status === "FAILED" ? "destructive" : "secondary"}
              >
                {job.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
