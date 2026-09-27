'use client';

import * as React from 'react';
import Image from 'next/image';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Expand, Image as ImageIcon, X } from 'lucide-react';

interface MovieImageItem {
  id: string;
  imageUrl: string;
  imageType: 'BACKDROP' | 'POSTER' | 'LOGO';
  aspectRatio?: number | null;
  width?: number | null;
  height?: number | null;
  voteAverage?: number | null;
}

interface MovieGalleryProps {
  images: MovieImageItem[];
  movieTitle?: string;
}

export function MovieGallery({ images, movieTitle = 'Movie' }: MovieGalleryProps) {
  const galleryImages = React.useMemo(
    () => images.filter((image) => image.imageType === 'BACKDROP' || image.imageType === 'POSTER'),
    [images]
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);

  const displayImages = galleryImages.slice(0, 6);
  const selectedImage = galleryImages[selectedIndex];

  const openImage = (index: number) => {
    setSelectedIndex(index);
    setIsOpen(true);
  };

  const showPrevious = React.useCallback(() => {
    setSelectedIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const showNext = React.useCallback(() => {
    setSelectedIndex((current) => (current + 1) % galleryImages.length);
  }, [galleryImages.length]);

  if (galleryImages.length === 0 || !selectedImage) return null;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <section className="mt-6 sm:mt-10" aria-labelledby="movie-gallery-heading">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ImageIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="movie-gallery-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
              Photos &amp; Wallpapers
            </h2>
            <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
              Open any photo to view the full gallery
            </p>
          </div>
          <DialogPrimitive.Trigger asChild>
            <button
              type="button"
              onClick={() => setSelectedIndex(0)}
              className="ml-auto min-h-11 shrink-0 rounded-xl border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/35 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              View all <span className="text-muted-foreground">({galleryImages.length})</span>
            </button>
          </DialogPrimitive.Trigger>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-3">
          {displayImages.map((image, index) => {
            const isPoster = image.imageType === 'POSTER';
            const hiddenCount = galleryImages.length - displayImages.length;

            return (
              <button
                type="button"
                key={image.id}
                onClick={() => openImage(index)}
                aria-label={`Open ${movieTitle} ${image.imageType.toLowerCase()} ${index + 1} of ${galleryImages.length}`}
                className={`group relative aspect-[16/10] w-[82vw] max-w-[20rem] shrink-0 snap-center overflow-hidden rounded-xl border bg-muted text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto sm:max-w-none ${isPoster ? 'sm:aspect-[2/3]' : 'sm:aspect-video'}`}
              >
                <Image
                  src={image.imageUrl}
                  alt={`${movieTitle} ${image.imageType.toLowerCase()} ${index + 1}`}
                  fill
                  sizes="(max-width: 639px) 82vw, (max-width: 1023px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.035] motion-reduce:transform-none"
                />
                <span
                  className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  aria-hidden="true"
                />
                <span
                  className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  aria-hidden="true"
                >
                  <Expand className="h-4 w-4" />
                </span>
                {index === displayImages.length - 1 && hiddenCount > 0 ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-semibold text-white backdrop-blur-[1px]">
                    +{hiddenCount} more
                  </span>
                ) : null}
                {image.width && image.height ? (
                  <span className="absolute bottom-2 left-2 hidden rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity sm:block group-hover:opacity-100 group-focus-visible:opacity-100">
                    {image.width}×{image.height}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden text-white focus:outline-none"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' && galleryImages.length > 1) {
              event.preventDefault();
              showPrevious();
            }
            if (event.key === 'ArrowRight' && galleryImages.length > 1) {
              event.preventDefault();
              showNext();
            }
          }}
        >
          <DialogPrimitive.Title className="sr-only">{movieTitle} photo gallery</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Full-screen gallery. Browse with the controls, a swipe gesture, or the left and right arrow keys.
          </DialogPrimitive.Description>

          <div className="relative z-10 flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-base">{movieTitle}</p>
              <p className="mt-0.5 text-xs text-white/65">
                {selectedIndex + 1} of {galleryImages.length}
                <span className="mx-1.5" aria-hidden="true">•</span>
                {selectedImage.imageType === 'BACKDROP' ? 'Wallpaper' : 'Poster'}
                {selectedImage.width && selectedImage.height ? ` · ${selectedImage.width}×${selectedImage.height}` : ''}
              </p>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label="Close photo gallery"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <div
            className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-3 py-4 sm:px-20 sm:py-6"
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (touchStartX.current === null || galleryImages.length < 2) return;
              const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
              const distance = endX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(distance) < 50) return;
              if (distance > 0) showPrevious();
              else showNext();
            }}
          >
            <div className="relative h-full w-full max-w-7xl">
              <Image
                key={selectedImage.id}
                src={selectedImage.imageUrl}
                alt={`${movieTitle} ${selectedImage.imageType === 'BACKDROP' ? 'wallpaper' : 'poster'} ${selectedIndex + 1}`}
                fill
                sizes="100vw"
                className="select-none object-contain"
                priority
                draggable={false}
              />
            </div>

            {galleryImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label="Show previous photo"
                  className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5 sm:flex"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Show next photo"
                  className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5 sm:flex"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            ) : null}
          </div>

          {galleryImages.length > 1 ? (
            <p className="shrink-0 border-t border-white/10 bg-black/35 px-4 py-3 text-center text-xs text-white/65 sm:hidden">
              Swipe left or right to browse photos
            </p>
          ) : null}

          {galleryImages.length > 1 ? (
            <div className="hidden shrink-0 justify-center gap-2 overflow-x-auto border-t border-white/10 bg-black/35 px-6 py-3 [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden">
              {galleryImages.map((image, index) => (
                <button
                  type="button"
                  key={image.id}
                  onClick={() => setSelectedIndex(index)}
                  aria-label={`Show photo ${index + 1}`}
                  aria-current={selectedIndex === index ? 'true' : undefined}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${selectedIndex === index ? 'border-white opacity-100' : 'border-transparent opacity-55 hover:opacity-90'}`}
                >
                  <Image
                    src={image.imageUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
