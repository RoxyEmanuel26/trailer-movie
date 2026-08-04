import * as React from "react"
import { Badge } from "@/components/ui/badge"

export function SystemStatusCard() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6 pb-4">
        <h3 className="font-semibold leading-none tracking-tight">System Status</h3>
      </div>
      <div className="px-6 pb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Database</span>
            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Operational</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">TMDB API</span>
            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Operational</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Background Workers</span>
            <Badge variant="secondary">Idle</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
