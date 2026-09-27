'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ImportIdPanel() {
  const [tmdbId, setTmdbId] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const enqueue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = Number(tmdbId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      toast.error('Enter a valid positive TMDB movie ID');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/admin/imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId: id }),
      });
      if (!response.ok) throw new Error('Could not queue this movie');
      toast.success(`Movie ${id} queued for the local worker`);
      setTmdbId('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not queue this movie');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={enqueue} className="max-w-xl space-y-4 rounded-lg border bg-card p-6">
      <div>
        <h2 className="text-xl font-semibold">Queue a TMDB movie ID</h2>
        <p className="mt-1 text-sm text-muted-foreground">The dashboard only stores the ID. Movie data is fetched when you run the local import worker.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="movie-tmdb-id">TMDB movie ID</Label>
        <Input id="movie-tmdb-id" inputMode="numeric" pattern="[0-9]+" required value={tmdbId} onChange={(event) => setTmdbId(event.target.value)} placeholder="e.g. 550" />
      </div>
      <Button type="submit" disabled={busy}>{busy ? 'Queueing…' : 'Queue movie'}</Button>
    </form>
  );
}
