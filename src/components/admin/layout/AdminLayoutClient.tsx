"use client"

import * as React from "react"
import { Sidebar } from "@/components/admin/navigation/Sidebar"
import { TopNav } from "@/components/admin/navigation/TopNav"
import { MobileNav } from "@/components/admin/navigation/MobileNav"
import { ToastProvider } from "@/components/admin/global/ToastProvider"
import { CommandPalette } from "@/components/admin/global/CommandPalette"

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 md:pl-0 flex-1 w-full max-w-full overflow-hidden">
          <TopNav onMobileMenuToggle={() => setMobileMenuOpen(true)} />
          <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
          <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>
      <ToastProvider />
      <CommandPalette />
    </div>
  )
}
