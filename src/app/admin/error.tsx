"use client"

import { GlobalErrorBoundary } from "@/components/admin/global/GlobalErrorBoundary"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <GlobalErrorBoundary error={error} reset={reset} />
}
