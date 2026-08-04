"use client"

import * as React from "react"
import { Spinner } from "@/components/ui/spinner"

export function GlobalLoading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <Spinner className="h-8 w-8 text-primary" />
      <p className="text-sm text-muted-foreground">Loading Admin CMS...</p>
    </div>
  )
}
