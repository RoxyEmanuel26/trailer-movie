"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

export function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("Admin Error:", error)
  }, [error])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-center p-4">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <span className="text-3xl">⚠️</span>
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Something went wrong!</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        An unexpected error occurred in the administration panel. The engineering team has been notified.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
        <Button onClick={() => reset()}>Try Again</Button>
      </div>
    </div>
  )
}
