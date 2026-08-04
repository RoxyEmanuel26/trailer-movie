import * as React from "react"
import { TagService } from "@/lib/services/TagService"
import { TagsClientWrapper } from "@/components/admin/tags/TagsClientWrapper"

export default async function TagsPage() {
  const tags = await TagService.listTags()

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
        <p className="text-muted-foreground">Manage your movie tags and keywords.</p>
      </div>

      <TagsClientWrapper initialData={tags} />
    </div>
  )
}
