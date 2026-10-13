"use client"

import { GlobalErrorBoundary } from "@/components/admin/global/GlobalErrorBoundary"

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return <GlobalErrorBoundary error={error} reset={retry} />
}
