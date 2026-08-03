import * as React from "react"
import { Badge } from "@/components/ui/badge"

export function GenreBadge({ name }: { name: string }) {
  return <Badge variant="outline">{name}</Badge>
}

export function RatingBadge({ rating }: { rating: number }) {
  const isHigh = rating >= 7.0
  const isMid = rating >= 5.0 && rating < 7.0
  return (
    <Badge variant={isHigh ? "default" : isMid ? "secondary" : "destructive"}>
      ⭐ {rating.toFixed(1)}
    </Badge>
  )
}
