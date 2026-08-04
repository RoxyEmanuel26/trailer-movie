"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Breadcrumb({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const pathname = usePathname()
  
  // This is a simplified breadcrumb generator based on the path.
  // In a real scenario, you'd map path segments to actual titles.
  const segments = pathname.split("/").filter(Boolean)
  
  if (segments.length <= 1) return null

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1
        const href = `/${segments.slice(0, index + 1).join("/")}`
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")

        return (
          <React.Fragment key={href}>
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
