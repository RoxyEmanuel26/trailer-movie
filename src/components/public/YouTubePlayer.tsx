'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  movieId?: string;
  autoplay?: boolean;
  className?: string;
  onReady?: () => void;
  onPlay?: () => void;
  onEnd?: () => void;
}

export function YouTubePlayer({
  videoId,
  movieId,
  className,
}: YouTubePlayerProps) {
  const [isReady, setIsReady] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);

  const startPlayback = () => {
    setHasStarted(true);
    if (movieId) {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'trailer_play',
          entityId: movieId,
          metadata: { trailerId: videoId },
        }),
        keepalive: true,
      }).catch(console.error);
    }
  };

  return (
    <div className={cn("relative w-full aspect-video rounded-xl overflow-hidden bg-muted", className)}>
      {!hasStarted ? (
        <button type="button" onClick={startPlayback} className="group absolute inset-0 w-full overflow-hidden text-white" aria-label="Play movie trailer">
          <Image src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="Movie trailer preview" fill priority sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />
          <span className="absolute inset-0 bg-black/25 transition group-hover:bg-black/15" />
          <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary shadow-2xl transition group-hover:scale-105"><Play className="ml-1 h-7 w-7 fill-current" /></span>
        </button>
      ) : (
        <>
          {!isReady ? <Skeleton className="absolute inset-0 h-full w-full rounded-none" /> : null}
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
            className={cn('absolute inset-0 h-full w-full border-0 transition-opacity duration-300', isReady ? 'opacity-100' : 'opacity-0')}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Movie trailer"
            onLoad={() => setIsReady(true)}
          />
        </>
      )}
    </div>
  );
}
