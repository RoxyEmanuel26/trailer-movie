import * as React from "react"
import { cn } from "@/lib/utils"

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "col"
  gap?: "sm" | "md" | "lg" | "xl"
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "between"
}

export function Stack({
  className,
  direction = "col",
  gap = "md",
  align = "stretch",
  justify = "start",
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        "flex",
        {
          "flex-col": direction === "col",
          "flex-row": direction === "row",
          "gap-2": gap === "sm",
          "gap-4": gap === "md",
          "gap-6": gap === "lg",
          "gap-8": gap === "xl",
          "items-start": align === "start",
          "items-center": align === "center",
          "items-end": align === "end",
          "items-stretch": align === "stretch",
          "justify-start": justify === "start",
          "justify-center": justify === "center",
          "justify-end": justify === "end",
          "justify-between": justify === "between",
        },
        className
      )}
      {...props}
    />
  )
}
