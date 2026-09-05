import * as React from "react"
import Image from "next/image"
import { Image as ImageIcon } from "lucide-react"

interface MovieImageItem {
  id: string;
  imageUrl: string;
  imageType: 'BACKDROP' | 'POSTER' | 'LOGO';
  aspectRatio?: number | null;
  width?: number | null;
  height?: number | null;
  voteAverage?: number | null;
}

export function MovieGallery({ images }: { images: MovieImageItem[] }) {
  if (!images || images.length === 0) return null;

  const backdrops = images.filter((img) => img.imageType === 'BACKDROP');
  const posters = images.filter((img) => img.imageType === 'POSTER');

  const displayImages = backdrops.length > 0 ? backdrops.slice(0, 6) : posters.slice(0, 6);

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold tracking-tight">Photos & Wallpapers</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
          {images.length} {images.length === 1 ? 'image' : 'images'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {displayImages.map((img) => {
          const isBackdrop = img.imageType === 'BACKDROP';
          return (
            <div
              key={img.id}
              className={`group relative overflow-hidden rounded-xl border bg-muted shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${
                isBackdrop ? 'aspect-video' : 'aspect-[2/3]'
              }`}
            >
              <Image
                src={img.imageUrl}
                alt="Movie gallery image"
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-all duration-300 group-hover:brightness-90"
              />
              {img.width && img.height && (
                <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.width}×{img.height}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
