"use client"

import * as React from "react"
import { useSession } from "@/components/auth/SessionProvider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export function UserMenu() {
  const { user } = useSession()

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email.slice(0, 2).toUpperCase()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium leading-none">{user?.name || "Admin User"}</p>
          <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
        </div>
        <div className="border-t my-1" />
        <div className="p-1">
          <Button variant="ghost" className="w-full justify-start text-sm h-8">
            Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start text-sm h-8">
            Sign out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
