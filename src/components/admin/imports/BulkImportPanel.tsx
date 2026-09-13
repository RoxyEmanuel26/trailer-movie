'use client';

import * as React from 'react';
import { Play, Pause, RefreshCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

type ImportBatch = {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  startDate: string;
  endDate: string;
  countryCode: string | null;
  currentPage: number;
  totalPages: number;
  queuedCount: number;
  skippedCount: number;
  errorMessage: string | null;
};

export function BulkImportPanel({ initialBatches = [] }: { initialBatches?: ImportBatch[] }) {
  const [startDate, setStartDate] = React.useState('2022-01-01');
  const [endDate, setEndDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [country, setCountry] = React.useState('');
  const [batches, setBatches] = React.useState<ImportBatch[]>(initialBatches);
  const [busy, setBusy] = React.useState(false);

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
      toast.success('Bulk discovery queued. It will continue after this page is closed.');
      await loadBatches();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create batch');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (batch: ImportBatch, action: 'pause' | 'resume') => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/imports/bulk/${batch.id}/${action}`, { method: 'POST' });
      if (!response.ok) throw new Error(`Failed to ${action} batch`);
      await loadBatches();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk import action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Persistent Bulk Discovery</h2>
        <p className="text-sm text-muted-foreground">Discovery progress is stored in the database and processed by the scheduled worker.</p>
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
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Queue discovery
      </Button>

      <div className="mt-8 space-y-4">
        {batches.map((batch) => {
          const progress = batch.totalPages > 0 ? Math.min(100, (batch.currentPage / batch.totalPages) * 100) : 0;
          return (
            <div key={batch.id} className="rounded-md border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-medium">{batch.startDate.slice(0, 10)} – {batch.endDate.slice(0, 10)} {batch.countryCode ? `· ${batch.countryCode}` : ''}</p><p className="text-sm text-muted-foreground">{batch.status} · Page {batch.currentPage}{batch.totalPages ? ` of ${batch.totalPages}` : ''}</p></div>
                {batch.status === 'PAUSED' ? (
                  <Button size="sm" variant="outline" onClick={() => changeStatus(batch, 'resume')} disabled={busy}><RefreshCcw className="mr-2 h-4 w-4" />Resume</Button>
                ) : !['COMPLETED', 'FAILED'].includes(batch.status) ? (
                  <Button size="sm" variant="outline" onClick={() => changeStatus(batch, 'pause')} disabled={busy}><Pause className="mr-2 h-4 w-4" />Pause</Button>
                ) : null}
              </div>
              <Progress value={progress} className="my-3 h-2" />
              <div className="flex gap-5 text-sm"><span><strong>{batch.queuedCount}</strong> queued</span><span><strong>{batch.skippedCount}</strong> skipped</span></div>
              {batch.errorMessage && <p className="mt-3 text-sm text-destructive">{batch.errorMessage}</p>}
            </div>
          );
        })}
        {batches.length === 0 && <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No bulk discovery runs yet.</p>}
      </div>
    </div>
  );
}
