import * as React from "react"
import { ImportManagerService } from "@/lib/services/ImportManagerService"
import { ImportSearchPanel } from "@/components/admin/imports/ImportSearchPanel"
import { ImportIdPanel } from "@/components/admin/imports/ImportIdPanel"
import { ImportQueueTable } from "@/components/admin/imports/ImportQueueTable"
import { BulkImportPanel } from "@/components/admin/imports/BulkImportPanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImportBatchService } from "@/lib/services/ImportBatchService"
import { isLocalImportMode } from "@/lib/jobs/execution-mode"

export default async function ImportsPage() {
  const localMode = isLocalImportMode()
  // Fetch existing jobs on server load
  const [jobsData, batches] = await Promise.all([
    ImportManagerService.listJobs({ take: 100, includeCompleted: false }),
    ImportBatchService.list(),
  ])
  // Keep terminal audit rows out of the active queue. Filtering the new enum
  // values in plain JavaScript also keeps dev hot reload safe when a running
  // process briefly still has the previous generated Prisma enum module.
  const initialJobs = jobsData.data.filter((job) => !['COMPLETED', 'SKIPPED', 'CANCELED'].includes(job.status))
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
        <p className="text-muted-foreground">{localMode ? 'Queue movies and monitor imports processed on your local computer.' : 'Search TMDB and manage background import jobs.'}</p>
      </div>

      <Tabs defaultValue="bulk" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="search">{localMode ? 'Queue TMDB ID' : 'Search TMDB'}</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
          <TabsTrigger value="queue">Queue & History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="mt-0 outline-none">
          {localMode ? <ImportIdPanel /> : <ImportSearchPanel />}
        </TabsContent>

        <TabsContent value="bulk" className="mt-0 outline-none">
          <BulkImportPanel initialBatches={initialBatches} localMode={localMode} />
        </TabsContent>
        
        <TabsContent value="queue" className="mt-0 outline-none">
          <ImportQueueTable initialJobs={initialJobs} localMode={localMode} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
