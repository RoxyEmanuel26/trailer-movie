import * as React from "react"
import { Badge } from "@/components/ui/badge"

export function StatusBadge({ status }: { status: string }) {
  const variantMap = {
    PUBLISHED: "default",
    COMPLETED: "default",
    DRAFT: "secondary",
    PENDING: "outline",
    IN_PROGRESS: "secondary",
    PARTIAL: "secondary",
    ARCHIVED: "destructive",
    FAILED: "destructive",
  } as const

  return <Badge variant={variantMap[status as keyof typeof variantMap] || "outline"}>{status}</Badge>
}
