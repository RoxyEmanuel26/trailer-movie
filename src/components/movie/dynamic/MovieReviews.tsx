'use client';

import * as React from 'react';
import Image from 'next/image';
import { Star, User } from 'lucide-react';

export function MovieReviews({ reviews, movieSlug }: { reviews: any[]; movieSlug?: string }) {
  if (!reviews || reviews.length === 0) {
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const jsonLd = movieSlug
    ? {
        '@context': 'https://schema.org',
        '@type': 'Movie',
        '@id': `${baseUrl}/watch/${movieSlug}`,
        review: reviews.map((r: any) => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: r.author },
          datePublished: r.createdAt || r.created_at,
          reviewBody: r.content,
          reviewRating:
            r.rating || r.author_details?.rating
              ? {
                  '@type': 'Rating',
                  ratingValue: r.rating || r.author_details?.rating,
                  bestRating: '10',
                }
              : undefined,
        })),
      }
    : null;

  return (
    <div className="mt-8">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <h2 className="text-xl font-semibold mb-4">User Reviews</h2>
      <div className="flex flex-col gap-4">
        {reviews.slice(0, 5).map((review: any, idx: number) => {
          const rating =
            typeof review.rating === 'number' ? review.rating : review.author_details?.rating;
          const avatar =
            review.authorAvatar ||
            (review.author_details?.avatar_path
              ? review.author_details.avatar_path.startsWith('http')
                ? review.author_details.avatar_path
                : `https://image.tmdb.org/t/p/w200${review.author_details.avatar_path}`
              : null);
          const date = review.createdAt || review.created_at;

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
                    <Image src={avatar} alt={review.author} fill className="object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{review.author}</p>
                  <div className="flex items-center text-xs text-muted-foreground gap-2">
                    {rating && (
                      <span className="flex items-center text-yellow-500 font-medium">
                        <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                        {rating.toFixed(1)}
                      </span>
                    )}
                    {date && <span>{formatReviewDate(date)}</span>}
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

function formatReviewDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function ReviewBody({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const canExpand = content.trim().length > 280;

  return (
    <div>
      <p
        className={`break-words text-sm leading-6 text-muted-foreground ${isExpanded ? '' : 'line-clamp-5 lg:line-clamp-none'}`}
      >
        {content}
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
