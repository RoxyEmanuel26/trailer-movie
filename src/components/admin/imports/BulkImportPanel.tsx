'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, AlertTriangle, RefreshCcw } from 'lucide-react';

export function BulkImportPanel() {
  const [startDate, setStartDate] = React.useState('2022-01-01');
  const [endDate, setEndDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const [country, setCountry] = React.useState(''); // Empty means 'All'
  const [status, setStatus] = React.useState<'IDLE' | 'RUNNING' | 'PAUSED' | 'RATE_LIMITED' | 'DONE'>('IDLE');
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(0);
  const [stats, setStats] = React.useState({ queued: 0, skipped: 0 });
  const [error, setError] = React.useState('');

  // Auto-pause ref to prevent race conditions during unmount/pause
  const isRunningRef = React.useRef(false);

  // Stop background process if component unmounts (e.g., user switches tabs)
  React.useEffect(() => {
    return () => {
      isRunningRef.current = false;
    };
  }, []);

  // Restore saved state on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('trailerTube_bulk_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStartDate(parsed.startDate);
        setEndDate(parsed.endDate);
        if (parsed.country !== undefined) setCountry(parsed.country);
        setCurrentPage(parsed.currentPage);
        setTotalPages(parsed.totalPages || 0);
        setStats(parsed.stats || { queued: 0, skipped: 0 });
        
        let restoredStatus: 'IDLE' | 'PAUSED' | 'DONE' = 'IDLE';
        if (parsed.totalPages > 0 && parsed.currentPage >= parsed.totalPages) {
          restoredStatus = 'DONE';
        } else if (parsed.currentPage > 1) {
          restoredStatus = 'PAUSED';
        }
        setStatus(restoredStatus);
      } catch (e) {}
    }
  }, []);

  // Save state on change
  React.useEffect(() => {
    if (status === 'DONE') {
      localStorage.removeItem('trailerTube_bulk_state');
    } else if (currentPage > 1 || status !== 'IDLE') {
      localStorage.setItem('trailerTube_bulk_state', JSON.stringify({
        startDate, endDate, country, currentPage, totalPages, stats
      }));
    }
  }, [startDate, endDate, country, currentPage, totalPages, stats, status]);

  const processNextPage = async (pageToProcess: number) => {
    if (!isRunningRef.current) return;

    try {
      const res = await fetch('/api/admin/imports/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: pageToProcess, startDate, endDate, country: country || undefined }),
      });

      if (res.status === 429) {
        setStatus('RATE_LIMITED');
        isRunningRef.current = false;
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch');
      }

      const data = await res.json();
      
      setStats(prev => ({
        queued: prev.queued + data.queued,
        skipped: prev.skipped + data.skipped,
      }));
      setTotalPages(data.totalPages);

      if (pageToProcess >= data.totalPages) {
        setStatus('DONE');
        isRunningRef.current = false;
        return;
      }

      setCurrentPage(pageToProcess + 1);
      
      // Artificial delay to prevent spamming DB too fast
      setTimeout(() => {
        if (isRunningRef.current) {
          processNextPage(pageToProcess + 1);
        }
      }, 500);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setStatus('PAUSED');
      isRunningRef.current = false;
    }
  };

  const handleStart = () => {
    if (isRunningRef.current) return; // Mencegah bug double-click (Race Condition)
    
    setError('');
    setStatus('RUNNING');
    isRunningRef.current = true;
    
    // If we're done, restart
    if (status === 'DONE') {
      setStats({ queued: 0, skipped: 0 });
      setCurrentPage(1);
      setTotalPages(0);
      processNextPage(1);
    } else {
      processNextPage(currentPage);
    }
  };

  const handlePause = () => {
    setStatus('PAUSED');
    isRunningRef.current = false;
  };

  const handleReset = () => {
    setStatus('IDLE');
    isRunningRef.current = false;
    setCurrentPage(1);
    setTotalPages(0);
    setStats({ queued: 0, skipped: 0 });
    setError('');
    localStorage.removeItem('trailerTube_bulk_state');
  };

  return (
    <div className="w-full bg-card border rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Bulk Auto-Import</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Automatically discover and queue all movies released between a date range. It skips duplicates safely.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label>Start Date (Release)</Label>
          <Input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            disabled={status === 'RUNNING' || (status === 'PAUSED' && currentPage > 1)}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date (Release)</Label>
          <Input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            disabled={status === 'RUNNING' || (status === 'PAUSED' && currentPage > 1)}
          />
        </div>
        <div className="space-y-2">
          <Label>Origin Country</Label>
          <select 
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={status === 'RUNNING' || (status === 'PAUSED' && currentPage > 1)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All Countries (Global)</option>
            <option value="US">United States (US)</option>
            <option value="KR">South Korea (KR)</option>
            <option value="JP">Japan (JP)</option>
            <option value="CN">China (CN)</option>
            <option value="ID">Indonesia (ID)</option>
            <option value="GB">United Kingdom (GB)</option>
            <option value="FR">France (FR)</option>
            <option value="IN">India (IN)</option>
            <option value="TH">Thailand (TH)</option>
          </select>
        </div>
      </div>

      {/* Progress Section */}
      {(status !== 'IDLE' || currentPage > 1) && (
        <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium">
              {status === 'RUNNING' ? 'Fetching TMDB Data...' : 
               status === 'PAUSED' ? 'Paused' :
               status === 'RATE_LIMITED' ? 'TMDB API Limit Reached' : 'Completed!'}
            </span>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} {totalPages > 0 ? `of ${totalPages}` : ''}
            </span>
          </div>
          
          <Progress value={totalPages > 0 ? (currentPage / totalPages) * 100 : 0} className="h-2 mb-4" />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-background border rounded-md p-3 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-green-500">{stats.queued}</span>
              <span className="text-muted-foreground">New Queued</span>
            </div>
            <div className="bg-background border rounded-md p-3 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-orange-500">{stats.skipped}</span>
              <span className="text-muted-foreground">Skipped (Duplicate)</span>
            </div>
          </div>

          {status === 'RATE_LIMITED' && (
            <div className="mt-4 flex items-start gap-3 text-orange-500 bg-orange-500/10 p-3 rounded-md border border-orange-500/20">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Rate Limit Hit</p>
                <p>TMDB has temporarily blocked requests. Your progress is saved. Please resume tomorrow or in a few hours.</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 text-red-500 text-sm bg-red-500/10 p-3 rounded-md border border-red-500/20">
              Error: {error}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {status === 'RUNNING' ? (
          <Button onClick={handlePause} variant="secondary" className="w-32">
            <Pause className="w-4 h-4 mr-2" /> Pause
          </Button>
        ) : (
          <Button onClick={handleStart} className="w-32">
            <Play className="w-4 h-4 mr-2" /> {status === 'DONE' ? 'Restart' : status === 'PAUSED' || status === 'RATE_LIMITED' ? 'Resume' : 'Start'}
          </Button>
        )}
        
        {(status === 'PAUSED' || status === 'DONE' || status === 'RATE_LIMITED') && (
          <Button onClick={handleReset} variant="outline" className="w-32">
            <RefreshCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
        )}
      </div>
    </div>
  );
}
