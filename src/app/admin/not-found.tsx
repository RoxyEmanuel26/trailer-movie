import * as React from "react"
import { EmptyLayout } from "@/components/admin/global/EmptyLayout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SearchX } from "lucide-react"

export default function AdminNotFound() {
  return (
    <EmptyLayout
      icon={<SearchX className="h-10 w-10 text-muted-foreground" />}
      title="Page Not Found"
      description="The page you are looking for does not exist or has been moved."
      action={
        <Link href="/admin/dashboard">
          <Button variant="default">Return to Dashboard</Button>
        </Link>
      }
    />
  )
}
