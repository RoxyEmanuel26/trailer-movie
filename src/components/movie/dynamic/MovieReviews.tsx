import * as React from "react"
import { Star, User } from "lucide-react"

export function MovieReviews({ reviews, movieSlug }: { reviews: any[], movieSlug?: string }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">User Reviews</h2>
        <div className="p-6 rounded-xl border border-dashed flex items-center justify-center bg-card/30">
          <p className="text-sm text-muted-foreground italic">No user reviews available for this movie yet.</p>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const jsonLd = movieSlug ? {
    "@context": "https://schema.org",
    "@type": "Movie",
    "@id": `${baseUrl}/watch/${movieSlug}`,
    "review": reviews.map((r: any) => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": r.author },
      "datePublished": r.created_at,
      "reviewBody": r.content,
      "reviewRating": r.author_details?.rating ? {
        "@type": "Rating",
        "ratingValue": r.author_details.rating,
        "bestRating": "10"
      } : undefined
    }))
  } : null;

  return (
    <div className="mt-8">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <h2 className="text-xl font-semibold mb-4">User Reviews</h2>
      <div className="flex flex-col gap-4">
        {reviews.slice(0, 3).map((review: any) => (
          <div key={review.id} className="p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">{review.author}</p>
                <div className="flex items-center text-xs text-muted-foreground gap-2">
                  {review.author_details?.rating && (
                    <span className="flex items-center text-yellow-500 font-medium">
                      <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                      {review.author_details.rating.toFixed(1)}
                    </span>
                  )}
                  <span>{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-4">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MovieReviewsSkeleton() {
  return (
    <div className="mt-8 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded mb-4"></div>
      <div className="flex flex-col gap-4">
        {[1, 2].map(i => (
          <div key={i} className="p-4 rounded-xl border bg-card h-32">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted"></div>
              <div className="flex flex-col gap-2"><div className="w-24 h-3 bg-muted"></div><div className="w-16 h-2 bg-muted"></div></div>
            </div>
            <div className="w-full h-10 bg-muted"></div>
          </div>
        ))}
      </div>
    </div>
  )
}