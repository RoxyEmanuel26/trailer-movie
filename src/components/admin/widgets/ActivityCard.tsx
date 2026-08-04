import * as React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function ActivityCard() {
  const activities = [
    { id: 1, user: "Admin", action: "published", target: "Inception", time: "2h ago" },
    { id: 2, user: "System", action: "imported", target: "15 new movies", time: "4h ago" },
    { id: 3, user: "Editor", action: "updated", target: "Sci-Fi Collection", time: "1d ago" },
  ]

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6 pb-4">
        <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
      </div>
      <div className="px-6 pb-6">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  <span className="font-semibold">{activity.user}</span> {activity.action}{" "}
                  <span className="font-semibold">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
