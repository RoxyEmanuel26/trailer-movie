"use client"

import * as React from "react"
import { Breadcrumb } from "./Breadcrumb"
import { UserMenu } from "./UserMenu"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TopNav({
  onMobileMenuToggle,
}: {
  onMobileMenuToggle: () => void
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        <Breadcrumb className="hidden md:flex" />
      </div>
      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  )
}
