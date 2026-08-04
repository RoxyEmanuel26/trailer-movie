import * as React from "react"
import { redirect } from "next/navigation"

// import { requireAdmin } from "@/lib/auth" 
// We mock this for now since we don't have the auth layer fully wired in the page yet.
const mockRequireAdmin = async () => {
  return {
    id: "admin-1",
    email: "admin@example.com",
    name: "System Admin",
    role: {
      name: "ADMIN",
      permissions: [{ permission: { action: "manage_all" } }],
    },
  }
}

import { SessionProvider } from "@/components/auth/SessionProvider"
import { AdminLayoutClient } from "@/components/admin/layout/AdminLayoutClient"

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await mockRequireAdmin()

  if (!user) {
    redirect("/login")
  }

  return (
    <SessionProvider initialUser={user}>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </SessionProvider>
  )
}
