import * as React from "react"
import { ImportManagerService } from "@/lib/services/ImportManagerService"
import { ImportSearchPanel } from "@/components/admin/imports/ImportSearchPanel"
import { ImportQueueTable } from "@/components/admin/imports/ImportQueueTable"
import { BulkImportPanel } from "@/components/admin/imports/BulkImportPanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImportBatchService } from "@/lib/services/ImportBatchService"

export default async function ImportsPage() {
  // Fetch existing jobs on server load
  const [jobsData, batches] = await Promise.all([
    ImportManagerService.listJobs({ take: 100 }),
    ImportBatchService.list(),
  ])
  const initialJobs = jobsData.data
  const initialBatches = batches.map((batch) => ({
    ...batch,
    startDate: batch.startDate.toISOString(),
    endDate: batch.endDate.toISOString(),
    nextRunAt: batch.nextRunAt?.toISOString() ?? null,
    startedAt: batch.startedAt?.toISOString() ?? null,
    completedAt: batch.completedAt?.toISOString() ?? null,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
  }))

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">TMDB Imports</h1>
        <p className="text-muted-foreground">Search TMDB and manage background import jobs.</p>
      </div>

      <Tabs defaultValue="bulk" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="search">Search TMDB</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
          <TabsTrigger value="queue">Queue & History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="mt-0 outline-none">
          <ImportSearchPanel />
        </TabsContent>

        <TabsContent value="bulk" className="mt-0 outline-none">
          <BulkImportPanel initialBatches={initialBatches} />
        </TabsContent>
        
        <TabsContent value="queue" className="mt-0 outline-none">
          <ImportQueueTable initialJobs={initialJobs} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
