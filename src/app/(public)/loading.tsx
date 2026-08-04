import { Film } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <Film className="h-12 w-12 animate-pulse text-muted-foreground" />
        <div className="absolute inset-0 rounded-full ring-2 ring-primary ring-offset-2 animate-ping opacity-20" />
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">Loading...</p>
    </div>
  );
}
