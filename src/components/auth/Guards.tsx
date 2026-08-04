"use client"

import * as React from "react"
import { useSession } from "./SessionProvider"
import { useRouter } from "next/navigation"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession()
  const router = useRouter()

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  }

  return <>{children}</>
}

export function PermissionGuard({ 
  children, 
  action 
}: { 
  children: React.ReactNode
  action: string 
}) {
  const { user, isLoading } = useSession()
  const router = useRouter()

  React.useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push("/login")
      return
    }

    const hasPerm = user.role?.permissions.some(p => p.permission.action === action)
    if (!hasPerm) {
      router.push("/admin/forbidden")
    }
  }, [user, isLoading, action, router])

  if (isLoading) return null

  const hasPerm = user?.role?.permissions.some(p => p.permission.action === action)
  if (!hasPerm) return null

  return <>{children}</>
}
