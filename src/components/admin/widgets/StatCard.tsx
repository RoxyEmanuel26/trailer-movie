import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: "up" | "down" | "neutral"
  trendValue?: string
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {(description || trendValue) && (
        <p className="text-xs text-muted-foreground mt-1">
          {trendValue && (
            <span
              className={cn(
                "mr-1",
                trend === "up" && "text-emerald-500",
                trend === "down" && "text-destructive"
              )}
            >
              {trendValue}
            </span>
          )}
          {description}
        </p>
      )}
    </div>
  )
}
