'use client';

import * as React from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
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
  onReady,
  onPlay,
  onEnd,
}: YouTubePlayerProps) {
  const [isReady, setIsReady] = React.useState(false);

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: autoplay ? 1 : 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  const handleReady = (event: any) => {
    setIsReady(true);
    if (onReady) onReady();
  };

  const handlePlay = (event: any) => {
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
    if (onPlay) onPlay();
  };

  const handleEnd = (event: any) => {
    if (movieId) {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'trailer_complete',
          entityId: movieId,
          metadata: { trailerId: videoId },
        }),
        keepalive: true,
      }).catch(console.error);
    }
    if (onEnd) onEnd();
  };

  return (
    <div className={cn("relative w-full aspect-video rounded-xl overflow-hidden bg-muted", className)}>
      {!isReady && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      )}
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={handleReady}
        onPlay={handlePlay}
        onEnd={handleEnd}
        className={cn(
          "absolute top-0 left-0 w-full h-full transition-opacity duration-500",
          isReady ? "opacity-100" : "opacity-0"
        )}
        iframeClassName="w-full h-full"
      />
    </div>
  );
}
