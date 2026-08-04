import * as React from "react"
import { CollectionService } from "@/lib/services/CollectionService"
import { CollectionsClientWrapper } from "@/components/admin/collections/CollectionsClientWrapper"

export default async function CollectionsPage() {
  const collections = await CollectionService.listCollections()

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
        <p className="text-muted-foreground">Manage your curated movie collections and featured sections.</p>
      </div>

      <CollectionsClientWrapper initialData={collections} />
    </div>
  )
}
