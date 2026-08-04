import * as React from "react"

export function ChartContainer({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col rounded-xl border bg-card p-6 text-card-foreground shadow h-80">
      <div>
        <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="mt-6 flex flex-1 items-center justify-center rounded-md border border-dashed text-muted-foreground">
        Chart Placeholder
      </div>
    </div>
  )
}
