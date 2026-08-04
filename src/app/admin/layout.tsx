import * as React from "react"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth/utils"

import { SessionProvider } from "@/components/auth/SessionProvider"
import { AdminLayoutClient } from "@/components/admin/layout/AdminLayoutClient"

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let adminSession;
  try {
    adminSession = await requireAdmin();
  } catch (error) {
    redirect("/login");
  }

  // SessionProvider usually takes the user object
  const user = adminSession?.user;

  if (!user) {
    redirect("/login")
  }

  return (
    <SessionProvider initialUser={user as any}>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </SessionProvider>
  )
}
