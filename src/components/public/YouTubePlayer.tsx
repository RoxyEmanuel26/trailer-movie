"use client"

import React, { useState } from 'react'
import { Play } from 'lucide-react'

interface YouTubePlayerProps {
  youtubeId: string;
  title: string;
  thumbnailUrl?: string;
}

export function YouTubePlayer({ youtubeId, title, thumbnailUrl }: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Fallback to high-res YouTube thumbnail if no poster/backdrop is provided
  const coverImage = thumbnailUrl || `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;

  if (isPlaying) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-border">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          title={title || "YouTube video player"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    );
  }

  return (
    <div 
      className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-border relative cursor-pointer group"
      onClick={() => setIsPlaying(true)}
      role="button"
      tabIndex={0}
      aria-label={`Play ${title} trailer`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsPlaying(true);
        }
      }}
    >
      <img
        src={coverImage}
        alt={`${title} Trailer Thumbnail`}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-black/20 flex items-center justify-center">
        <div className="w-20 h-20 bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg backdrop-blur-sm">
          <Play className="w-10 h-10 ml-2" fill="currentColor" />
        </div>
      </div>
    </div>
  )
}
