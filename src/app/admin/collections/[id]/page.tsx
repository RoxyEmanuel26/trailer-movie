import * as React from "react"
import { CollectionService } from "@/lib/services/CollectionService"
import { CollectionDetailClient } from "@/components/admin/collections/CollectionDetailClient"
import { notFound, redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth/utils"
import { NotFoundError, PermissionError, UnauthorizedError } from "@/lib/errors"

export default async function CollectionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  try {
    await requireAdmin("read:collections")
  } catch (error) {
    if (error instanceof PermissionError) redirect("/admin/forbidden")
    if (error instanceof UnauthorizedError) redirect("/login")
    throw error
  }

  const { id } = await params
  let collection
  
  try {
    collection = await CollectionService.getCollection(id)
  } catch (err) {
    if (err instanceof NotFoundError) notFound()
    throw err
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
