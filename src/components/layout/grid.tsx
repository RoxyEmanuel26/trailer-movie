import * as React from "react"
import { cn } from "@/lib/utils"

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: "sm" | "md" | "lg" | "xl"
}

export function Grid({ className, columns = 1, gap = "md", ...props }: GridProps) {
  return (
    <div
      className={cn(
        "grid",
        {
          "grid-cols-1": columns === 1,
          "grid-cols-2": columns === 2,
          "grid-cols-3": columns === 3,
          "grid-cols-4": columns === 4,
          "grid-cols-5": columns === 5,
          "grid-cols-6": columns === 6,
          "grid-cols-12": columns === 12,
          "gap-2": gap === "sm",
          "gap-4": gap === "md",
          "gap-6": gap === "lg",
          "gap-8": gap === "xl",
        },
        className
      )}
      {...props}
    />
  )
}
