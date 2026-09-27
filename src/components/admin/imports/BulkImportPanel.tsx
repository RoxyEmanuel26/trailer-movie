'use client';

import * as React from 'react';
import { Play, Pause, RefreshCcw, Loader2, XCircle, History, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ConfirmationDialog } from '@/components/admin/global/ConfirmationDialog';

type ImportBatch = {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'IMPORTING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  startDate: string;
  endDate: string;
  countryCode: string | null;
  currentPage: number;
  totalPages: number;
  queuedCount: number;
  skippedCount: number;
  importedCount: number;
  failedCount: number;
  unavailableCount: number;
  errorMessage: string | null;
};

export function BulkImportPanel({ initialBatches = [], localMode = false }: { initialBatches?: ImportBatch[]; localMode?: boolean }) {
  const [startDate, setStartDate] = React.useState('2022-01-01');
  const [endDate, setEndDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [country, setCountry] = React.useState('');
  const [batches, setBatches] = React.useState<ImportBatch[]>(initialBatches);
  const [busy, setBusy] = React.useState(false);
  const [cancelTarget, setCancelTarget] = React.useState<ImportBatch | null>(null);

  const loadBatches = React.useCallback(async (signal?: AbortSignal) => {
    const response = await fetch('/api/admin/imports/bulk', { signal, cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to load bulk imports');
    const payload = await response.json();
    setBatches(payload.data.batches || []);
  }, []);

  React.useEffect(() => {
    const interval = window.setInterval(() => void loadBatches().catch(() => undefined), 5000);
    return () => window.clearInterval(interval);
  }, [loadBatches]);

  const createBatch = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/imports/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, country: country || undefined }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to create batch');
      toast.success(localMode ? 'Bulk discovery queued for the local worker.' : 'Bulk discovery queued. It will continue after this page is closed.');
      await loadBatches();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create batch');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (batch: ImportBatch, action: 'pause' | 'resume' | 'cancel') => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/imports/bulk/${batch.id}/${action}`, { method: 'POST' });
      if (!response.ok) throw new Error(`Failed to ${action} batch`);
      toast.success(action === 'cancel' ? 'Bulk import canceled and moved to the log.' : `Bulk import ${action}d.`);
      await loadBatches();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk import action failed');
    } finally {
      setBusy(false);
      if (action === 'cancel') setCancelTarget(null);
    }
  };

  const activeBatches = batches.filter((batch) => ['PENDING', 'RUNNING', 'PAUSED', 'IMPORTING'].includes(batch.status));
  const historyBatches = batches.filter((batch) => ['COMPLETED', 'FAILED', 'CANCELED'].includes(batch.status));

  const renderBatch = (batch: ImportBatch, history = false) => {
    const discoveryComplete = ['IMPORTING', 'COMPLETED', 'FAILED', 'CANCELED'].includes(batch.status);
    const completedPages = discoveryComplete ? batch.totalPages : Math.max(0, batch.currentPage - 1);
    const progress = batch.totalPages > 0 ? Math.min(100, (completedPages / batch.totalPages) * 100) : 0;
    const phase = batch.status === 'IMPORTING'
      ? 'SAVING MOVIES TO DATABASE'
      : batch.status === 'PENDING' && batch.totalPages === 0
        ? 'WAITING FOR LOCAL WORKER'
        : batch.status;
    const hasTrackedPersistence = batch.importedCount + batch.failedCount + batch.unavailableCount > 0 || batch.queuedCount === 0;
    return (
      <div key={batch.id} className="rounded-md border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium">{batch.startDate.slice(0, 10)} – {batch.endDate.slice(0, 10)} {batch.countryCode ? `· ${batch.countryCode}` : ''}</p>
            <p className="text-sm text-muted-foreground">{phase} · Page {batch.currentPage}{batch.totalPages ? ` of ${batch.totalPages}` : ''}</p>
          </div>
          {!history && (
            <div className="flex flex-wrap gap-2">
              {batch.status === 'PAUSED' ? (
                <Button size="sm" variant="outline" onClick={() => changeStatus(batch, 'resume')} disabled={busy}><RefreshCcw className="mr-2 h-4 w-4" />Resume</Button>
              ) : ['PENDING', 'RUNNING'].includes(batch.status) ? (
                <Button size="sm" variant="outline" onClick={() => changeStatus(batch, 'pause')} disabled={busy}><Pause className="mr-2 h-4 w-4" />Pause</Button>
              ) : null}
              <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setCancelTarget(batch)} disabled={busy}>
                <XCircle className="mr-2 h-4 w-4" />Cancel
              </Button>
            </div>
          )}
        </div>
        <Progress value={progress} className="my-3 h-2" />
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span><strong>{batch.queuedCount}</strong> discovered</span>
          <span><strong>{batch.skippedCount}</strong> already existed</span>
          {hasTrackedPersistence && (discoveryComplete || batch.importedCount > 0) && <span className="text-emerald-700 dark:text-emerald-400"><strong>{batch.importedCount}</strong> saved</span>}
          {hasTrackedPersistence && (discoveryComplete || batch.unavailableCount > 0) && <span><strong>{batch.unavailableCount}</strong> unavailable</span>}
          {hasTrackedPersistence && (discoveryComplete || batch.failedCount > 0) && <span className={batch.failedCount ? 'text-destructive' : ''}><strong>{batch.failedCount}</strong> failed</span>}
          {!hasTrackedPersistence && history && <span className="text-muted-foreground">Legacy run · detailed save counts were not tracked</span>}
        </div>
        {batch.errorMessage && <p className="mt-3 text-sm text-destructive">{batch.errorMessage}</p>}
      </div>
    );
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Persistent Bulk Discovery</h2>
        <p className="text-sm text-muted-foreground">{localMode ? 'Discovery and movie jobs are stored in the database. Run pnpm import:process-local; it processes all current work and exits automatically when finished.' : 'Discovery progress is stored in the database and processed by the scheduled worker.'}</p>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="space-y-2"><Label htmlFor="import-start">Start date</Label><Input id="import-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="import-end">End date</Label><Input id="import-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>
        <div className="space-y-2">
          <Label htmlFor="import-country">Origin country</Label>
          <select id="import-country" value={country} onChange={(event) => setCountry(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">All countries</option><option value="US">United States</option><option value="GB">United Kingdom</option>
            <option value="ID">Indonesia</option><option value="JP">Japan</option><option value="KR">South Korea</option>
            <option value="CN">China</option><option value="IN">India</option><option value="FR">France</option><option value="TH">Thailand</option>
          </select>
        </div>
      </div>
      <Button onClick={createBatch} disabled={busy || !startDate || !endDate}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Queue bulk import
      </Button>

      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-2"><Play className="h-4 w-4 text-primary" /><h3 className="font-semibold">Active imports</h3></div>
        {activeBatches.map((batch) => renderBatch(batch))}
        {activeBatches.length === 0 && <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No active bulk imports. Finished runs appear in the log below.</p>}

        <div className="flex items-center gap-2 pt-4"><History className="h-4 w-4 text-muted-foreground" /><h3 className="font-semibold">Bulk import log</h3></div>
        {historyBatches.map((batch) => renderBatch(batch, true))}
        {historyBatches.length === 0 && <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 h-5 w-5" />No finished bulk imports yet.</p>}
      </div>

      <ConfirmationDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => { if (!open && !busy) setCancelTarget(null); }}
        title="Cancel this bulk import?"
        description="Discovery will stop and every linked movie job that has not started will be canceled. Jobs already running may finish safely. The run will remain in the log."
        confirmText="Cancel import"
        isDestructive
        isLoading={busy}
        onConfirm={() => { if (cancelTarget) void changeStatus(cancelTarget, 'cancel'); }}
      />
    </div>
  );
}
