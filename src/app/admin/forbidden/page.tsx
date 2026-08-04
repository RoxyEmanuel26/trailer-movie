import * as React from "react"
import { EmptyLayout } from "@/components/admin/global/EmptyLayout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"

export default function AdminForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/40">
      <EmptyLayout
        icon={<ShieldAlert className="h-10 w-10 text-destructive" />}
        title="Access Denied"
        description="You do not have the required permissions to view this module."
        action={
          <Link href="/admin/dashboard">
            <Button variant="default">Return to Dashboard</Button>
          </Link>
        }
        className="bg-card w-full max-w-md shadow-sm border"
      />
    </div>
  )
}
