import * as React from "react"
import { CollectionService } from "@/lib/services/CollectionService"
import { CollectionDetailClient } from "@/components/admin/collections/CollectionDetailClient"
import { notFound } from "next/navigation"

export default async function CollectionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let collection
  
  try {
    collection = await CollectionService.getCollection(id)
  } catch (err) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Collection: {collection.title}</h1>
        <p className="text-muted-foreground">Manage the movies in this collection and their display order.</p>
      </div>

      <CollectionDetailClient collection={collection} />
    </div>
  )
}
