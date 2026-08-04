import Image from 'next/image';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrailerPlayerPlaceholderProps {
  backdropUrl: string | null;
  title: string;
}

export function TrailerPlayerPlaceholder({ backdropUrl, title }: TrailerPlayerPlaceholderProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black group flex items-center justify-center border shadow-xl">
      {backdropUrl && (
        <Image
          src={backdropUrl}
          alt={`Backdrop for ${title}`}
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover opacity-60 transition-opacity group-hover:opacity-40"
        />
      )}
      
      {/* Play button overlay */}
      <div className="absolute z-10 flex flex-col items-center gap-4">
        <Button 
          size="icon" 
          variant="secondary"
          className="h-20 w-20 rounded-full border-4 border-background/50 bg-background/50 backdrop-blur-md transition-transform group-hover:scale-110 hover:bg-background/80"
        >
          <Play className="h-10 w-10 ml-2" />
        </Button>
        <p className="text-sm font-medium text-white drop-shadow-md">Trailer coming in Phase 36</p>
      </div>
      
      {/* Gradient fade out at bottom for smooth blending */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
