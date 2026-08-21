'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
  autoplay = false,
  className,
}: YouTubePlayerProps) {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Record analytics event when the player is mounted
    if (movieId) {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'trailer_view',
          entityId: movieId,
          metadata: { trailerId: videoId },
        }),
        keepalive: true,
      }).catch(console.error);
    }
  }, [movieId, videoId]);

  return (
    <div className={cn("relative w-full aspect-video rounded-xl overflow-hidden bg-muted", className)}>
      {!isReady && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      )}
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&modestbranding=1&rel=0`}
        className={cn(
          "absolute top-0 left-0 w-full h-full border-0 transition-opacity duration-500",
          isReady ? "opacity-100" : "opacity-0"
        )}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Movie Trailer"
        onLoad={() => setIsReady(true)}
      />
    </div>
  );
}
