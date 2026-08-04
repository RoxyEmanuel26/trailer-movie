"use client"

import * as React from "react"

export interface User {
  id: string
  email: string
  name?: string
  role?: {
    name: string
    permissions: { permission: { action: string } }[]
  }
}

export interface SessionContextValue {
  user: User | null
  isLoading: boolean
}

const SessionContext = React.createContext<SessionContextValue>({
  user: null,
  isLoading: true,
})

export function SessionProvider({ 
  children, 
  initialUser 
}: { 
  children: React.ReactNode
  initialUser: User | null 
}) {
  return (
    <SessionContext.Provider value={{ user: initialUser, isLoading: false }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return React.useContext(SessionContext)
}
