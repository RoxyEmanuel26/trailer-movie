import * as React from "react"
import { EmptyLayout } from "@/components/admin/global/EmptyLayout"
import { LayoutDashboard } from "lucide-react"

export default function DashboardPage() {
  return (
    <EmptyLayout
      icon={<LayoutDashboard className="h-8 w-8" />}
      title="Dashboard"
      description="Welcome to the Admin Dashboard."
    />
  )
}
