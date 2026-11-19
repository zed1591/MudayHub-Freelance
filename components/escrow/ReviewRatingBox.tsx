"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { Review } from "@/lib/types";

interface Props {
  counterpartyName: string;
  reviews: Review[];
  userId: string;
  onSubmitReview: (rating: number, comment: string) => Promise<void>;
}

export function ReviewRatingBox({
  counterpartyName,
  reviews,
  userId,
  onSubmitReview,
}: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(
    Boolean(reviews.some((r) => r.author_id === userId))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    await onSubmitReview(rating, comment);
    setSubmitting(false);
    setReviewSubmitted(true);
  }

  return (
    <div className="card-surface p-7 rounded-3xl border border-slate-200/90 space-y-5 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          <span>Client &amp; Freelancer Reviews</span>
        </h3>
        <span className="text-xs text-slate-500">Public reputation verified on escrow</span>
      </div>

      {!reviewSubmitted ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
        >
          <p className="text-xs text-slate-700">
            Rate your experience with <strong className="text-slate-900">{counterpartyName}</strong>:
          </p>

          {/* Star selector */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setRating(s)}
                className="p-1 focus:outline-none"
              >
                <Star
                  className={`h-6 w-6 transition-all ${
                    s <= rating
                      ? "fill-amber-500 text-amber-500 scale-110"
                      : "text-slate-300 hover:text-slate-400"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-xs font-bold text-amber-600">{rating} of 5 Stars</span>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share feedback on communication, quality of work, and timeliness..."
            required
            className="input-field text-xs min-h-[70px]"
          />

          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="btn-primary !text-xs font-bold shadow-ochre"
          >
            {submitting ? "Submitting…" : "Post Review"}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 font-medium">
          ✓ Your review has been recorded and updated on the talent&apos;s public profile.
        </div>
      )}

      {/* Existing reviews */}
      {reviews.length > 0 && (
        <div className="divide-y divide-slate-100 pt-2 space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="pt-4 first:pt-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">
                  {r.author?.full_name || "Reviewer"}
                </span>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  <span>{r.rating}.0</span>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
