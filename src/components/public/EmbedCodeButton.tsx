'use client';

import * as React from 'react';
import { Check, Code2, Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import { buildMovieEmbedSnippet } from '@/lib/embed-snippet';

interface EmbedCodeButtonProps {
  siteUrl: string;
  slug: string;
  title: string;
  year: number | null;
}

export function EmbedCodeButton({ siteUrl, slug, title, year }: EmbedCodeButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const snippet = React.useMemo(
    () => buildMovieEmbedSnippet({ siteUrl, slug, title, year }),
    [siteUrl, slug, title, year],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.html);
      setCopied(true);
      toast.success('Embed HTML copied to clipboard');
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error('Could not copy embed snippet');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:text-primary active:scale-[.98]"
      >
        <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Embed Card</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={`Embed code for ${title}`}
          className="mt-3 w-full max-w-xl rounded-2xl border bg-card p-4 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Embed Trailer Card
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Paste into any blog, Substack, WordPress post, or Notion embed block.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close embed dialog"
              className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <pre className="overflow-x-auto rounded-xl border bg-background/90 p-3 text-[11px] leading-relaxed text-foreground">
            <code>{snippet.html}</code>
          </pre>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <a
              href={snippet.embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-primary hover:underline"
            >
              Preview card ↗
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied HTML!' : 'Copy Embed HTML'}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
