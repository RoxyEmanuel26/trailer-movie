'use client';

import * as React from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareMovieButtonProps {
  title: string;
  year: number | null;
  url: string;
}

export function ShareMovieButton({ title, year, url }: ShareMovieButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const label = year ? `${title} (${year})` : title;
  const shareText = `Watch the official trailer and see where to stream ${label} on MovieFlix:`;

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${label} — Trailer & Where to Watch | MovieFlix`,
          text: shareText,
          url,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
    await handleCopy();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Movie link copied to clipboard');
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`;
  const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={`Share ${label}`}>
      <button
        type="button"
        onClick={handleNativeShare}
        className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition hover:opacity-90 active:scale-[.98]"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Share trailer</span>
      </button>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Share ${label} on WhatsApp`}
        className="inline-flex min-h-9 items-center rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        WhatsApp
      </a>

      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Share ${label} on X`}
        className="inline-flex min-h-9 items-center rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        X / Twitter
      </a>

      <a
        href={telegramHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Share ${label} on Telegram`}
        className="inline-flex min-h-9 items-center rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        Telegram
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            <span className="text-foreground">Copied</span>
          </>
        ) : (
          <>
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Copy link</span>
          </>
        )}
      </button>
    </div>
  );
}
