"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Film, 
  Tags, 
  Layers, 
  Download, 
  Search, 
  Home, 
  Settings, 
  ShieldAlert, 
  Users, 
  Key 
} from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Movies", href: "/admin/movies", icon: Film },
  { title: "Genres & Tags", href: "/admin/genres", icon: Tags },
  { title: "Collections", href: "/admin/collections", icon: Layers },
  { title: "Imports", href: "/admin/imports", icon: Download },
  { title: "SEO", href: "/admin/seo", icon: Search },
  { title: "Homepage", href: "/admin/homepage", icon: Home },
  { title: "Settings", href: "/admin/settings", icon: Settings },
  { title: "Audit Logs", href: "/admin/audit", icon: ShieldAlert },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Permissions", href: "/admin/permissions", icon: Key },
]

export function Sidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "hidden w-64 flex-col border-r bg-card md:flex",
        className
      )}
    >
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
          <Film className="h-5 w-5" />
          <span>Trailer CMS</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
