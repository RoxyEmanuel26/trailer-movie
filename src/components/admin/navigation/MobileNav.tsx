"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Sidebar } from "./Sidebar"

export function MobileNav({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const pathname = usePathname()

  // Close nav on route change
  React.useEffect(() => {
    onOpenChange(false)
  }, [pathname, onOpenChange])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 flex w-64 md:hidden">
        {/* We reuse the Sidebar content but force it visible inside the sheet */}
        <Sidebar className="flex w-full border-r-0 h-full" />
      </SheetContent>
    </Sheet>
  )
}
