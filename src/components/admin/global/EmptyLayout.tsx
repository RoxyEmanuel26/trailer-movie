"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface EmptyLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyLayout({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50",
        className
      )}
      {...props}
    >
      {icon && <div className="mb-4 rounded-full bg-muted p-3">{icon}</div>}
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      {description && <p className="mb-4 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
