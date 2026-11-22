'use client';

import * as React from 'react';
import Image from 'next/image';
import { Star, User } from 'lucide-react';

function resolveSafeReviewAvatar(review: any): string | null {
  const direct = typeof review?.authorAvatar === 'string' ? review.authorAvatar.trim() : '';
  if (direct.startsWith('https://image.tmdb.org/') && !direct.includes('/http')) {
    return direct;
  }
  const rawPath =
    typeof review?.author_details?.avatar_path === 'string'
      ? review.author_details.avatar_path.trim()
      : '';
  if (rawPath.startsWith('/') && !/^\/https?:\/\//i.test(rawPath)) {
    return `https://image.tmdb.org/t/p/w200${rawPath}`;
  }
  return null;
}

export function MovieReviews({ reviews }: { reviews: any[]; movieSlug?: string }) {
  const validReviews = Array.isArray(reviews)
    ? reviews.filter((review) => Boolean(review && typeof review === 'object'))
    : [];

  if (validReviews.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">User Reviews</h2>
        <div className="p-6 rounded-xl border border-dashed flex items-center justify-center bg-card/30">
          <p className="text-sm text-muted-foreground italic">
            No user reviews available for this movie yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">User Reviews</h2>
      <div className="flex flex-col gap-4">
        {validReviews.slice(0, 5).map((review: any, idx: number) => {
          const rating =
            typeof review.rating === 'number'
              ? review.rating
              : typeof review.author_details?.rating === 'number'
                ? review.author_details.rating
                : null;
          const avatar = resolveSafeReviewAvatar(review);
          const date = review.createdAt || review.created_at;
          const formattedDate = date ? formatReviewDate(date) : null;
          const authorName = typeof review.author === 'string' && review.author.trim() ? review.author : 'Anonymous';

          return (
            <div
              key={
                review.id ? `${review.id}-${idx}` : review.tmdbId ? `${review.tmdbId}-${idx}` : idx
              }
              className="p-4 rounded-xl border bg-card"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0 border">
                  {avatar ? (
                    <Image src={avatar} alt={authorName} fill sizes="40px" className="object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{authorName}</p>
                  <div className="flex items-center text-xs text-muted-foreground gap-2">
                    {rating !== null && rating > 0 ? (
                      <span className="flex items-center text-yellow-500 font-medium">
                        <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                        {rating.toFixed(1)}
                      </span>
                    ) : null}
                    {formattedDate ? <span>{formattedDate}</span> : null}
                  </div>
                </div>
              </div>
              <ReviewBody content={review.content} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatReviewDate(value: string | Date): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

function ReviewBody({ content }: { content?: string | null }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const safeContent = typeof content === 'string' ? content : '';
  const canExpand = safeContent.trim().length > 280;

  return (
    <div>
      <p
        className={`break-words text-sm leading-6 text-muted-foreground ${isExpanded ? '' : 'line-clamp-5 lg:line-clamp-none'}`}
      >
        {safeContent}
      </p>
      {canExpand ? (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          className="mt-2 min-h-11 text-sm font-semibold text-primary hover:underline lg:hidden"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      ) : null}
    </div>
  );
}

export function MovieReviewsSkeleton() {
  return (
    <div className="mt-8 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded mb-4"></div>
      <div className="flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 rounded-xl border bg-card h-32">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted"></div>
              <div className="flex flex-col gap-2">
                <div className="w-24 h-3 bg-muted"></div>
                <div className="w-16 h-2 bg-muted"></div>
              </div>
            </div>
            <div className="w-full h-10 bg-muted"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
