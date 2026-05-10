"use client";

import { useState } from "react";
import { Eye, EyeOff, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteReviewAction,
  togglePublishReviewAction,
} from "@/lib/actions/reviews";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type Review = {
  id: string;
  productId: string;
  authorName: string;
  authorEmail: string | null;
  rating: number;
  body: string;
  isPublished: boolean;
  createdAt: Date;
};

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-8 text-center text-sm text-[color:var(--color-muted)]">
        Henüz yorum yok. Sağ panelden yorum ekleyebilirsin.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[color:var(--color-border)]">
      {reviews.map((r) => (
        <ReviewItem key={r.id} review={r} />
      ))}
    </ul>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(review.body.length < 280);
  const showToggle = review.body.length >= 280;
  const truncated = !expanded && showToggle ? review.body.slice(0, 240) : review.body;

  return (
    <li
      className={cn(
        "py-4 transition",
        !review.isPublished && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-semibold text-white">
          {review.authorName.charAt(0).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{review.authorName}</span>
            <Stars rating={review.rating} />
            {!review.isPublished && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Taslak
              </span>
            )}
            <span className="text-xs text-[color:var(--color-muted)]">
              · {formatRelativeTime(review.createdAt)}
            </span>
          </div>

          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
            {truncated}
            {!expanded && showToggle && (
              <span>
                …{" "}
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="text-[color:var(--color-accent)] hover:underline"
                >
                  devamı
                </button>
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
          <form action={togglePublishReviewAction}>
            <input type="hidden" name="id" value={review.id} />
            <input type="hidden" name="productId" value={review.productId} />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label={review.isPublished ? "Taslağa al" : "Yayınla"}
              title={review.isPublished ? "Taslağa al" : "Yayınla"}
            >
              {review.isPublished ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </form>
          <form action={deleteReviewAction}>
            <input type="hidden" name="id" value={review.id} />
            <input type="hidden" name="productId" value={review.productId} />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="Sil"
              className="text-[color:var(--color-muted)] hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </li>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center"
      aria-label={`${rating} / 5`}
      title={`${rating} / 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-[color:var(--color-fg)]/20"
          )}
        />
      ))}
    </span>
  );
}
