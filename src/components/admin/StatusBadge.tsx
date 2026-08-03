import * as React from "react"
import { Badge } from "@/components/ui/badge"

export function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  const variantMap = {
    PUBLISHED: "default",
    DRAFT: "secondary",
    ARCHIVED: "destructive",
  } as const

  return <Badge variant={variantMap[status] || "outline"}>{status}</Badge>
}
