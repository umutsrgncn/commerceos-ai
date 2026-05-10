"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  clearReplyAction,
  deleteReviewAction,
  replyToReviewAction,
  togglePublishReviewAction,
  type ReviewActionState,
} from "@/lib/actions/reviews";
import { suggestReplyAction } from "@/lib/actions/review-ai";
import { ProductThumb } from "@/components/products/product-thumb";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type Review = {
  id: string;
  rating: number;
  body: string;
  authorName: string;
  authorEmail: string | null;
  isPublished: boolean;
  reply: string | null;
  repliedAt: Date | null;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    sku: string;
    images: unknown;
  };
};

export function ReviewCard({ review }: { review: Review }) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState(review.reply ?? "");
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [saveState, saveAction] = useActionState<ReviewActionState, FormData>(
    replyToReviewAction,
    null
  );

  // Server action başarılı olunca composer'ı kapat. useEffect kullanıyoruz —
  // render içinde setState çağırmak React error verir.
  useEffect(() => {
    if (saveState?.ok) {
      setComposerOpen(false);
    }
  }, [saveState?.ok]);

  async function generateAI() {
    setAiPending(true);
    setAiError(null);
    const res = await suggestReplyAction(review.id);
    setAiPending(false);
    if (!res.ok) {
      setAiError(res.error);
      return;
    }
    setDraft(res.text);
    setComposerOpen(true);
  }

  function startReply() {
    setDraft(review.reply ?? "");
    setComposerOpen(true);
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-4 transition",
        !review.isPublished && "opacity-70"
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <ProductThumb
          images={review.product.images}
          alt={review.product.name}
          className="h-14 w-14"
          rounded="lg"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/products/${review.product.id}`}
              className="text-sm font-medium hover:underline"
            >
              {review.product.name}
            </Link>
            <span className="font-mono text-xs text-[color:var(--color-muted)]">
              {review.product.sku}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-[color:var(--color-fg)]">
              {review.authorName}
            </span>
            <Stars rating={review.rating} />
            {!review.isPublished && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Taslak
              </span>
            )}
            {review.reply && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <MessageSquare className="h-2.5 w-2.5" />
                Cevaplandı
              </span>
            )}
            <span className="text-[color:var(--color-muted)]">
              · {formatRelativeTime(review.createdAt)}
            </span>
          </div>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
            {review.body}
          </p>
        </div>

        <div className="flex shrink-0 gap-1">
          <form action={togglePublishReviewAction}>
            <input type="hidden" name="id" value={review.id} />
            <input type="hidden" name="productId" value={review.product.id} />
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
            <input type="hidden" name="productId" value={review.product.id} />
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

      {/* Mevcut cevap (composer kapalıyken) */}
      {review.reply && !composerOpen && (
        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <MessageSquare className="h-3 w-3" />
              Mağaza cevabı
              {review.repliedAt && (
                <span className="font-normal normal-case text-[color:var(--color-muted)]">
                  · {formatRelativeTime(review.repliedAt)}
                </span>
              )}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={startReply}
                className="h-6 px-2 text-[10px]"
              >
                Düzenle
              </Button>
              <form action={clearReplyAction}>
                <input type="hidden" name="id" value={review.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] text-red-500 hover:text-red-600"
                  aria-label="Cevabı sil"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </form>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-xs leading-relaxed">
            {review.reply}
          </p>
        </div>
      )}

      {/* Composer (yazma modu) */}
      {composerOpen && (
        <form action={saveAction} className="mt-3 space-y-2">
          <input type="hidden" name="id" value={review.id} />
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              <MessageSquare className="h-3 w-3" />
              {review.reply ? "Cevabı düzenle" : "Cevap yaz"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateAI}
              disabled={aiPending}
              className="h-7 px-2 text-xs"
            >
              {aiPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  AI yazıyor…
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  AI ile doldur
                </>
              )}
            </Button>
          </div>

          {aiError && <p className="text-xs text-red-500">{aiError}</p>}

          <Textarea
            name="reply"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            minLength={5}
            placeholder="Cevabını yaz veya AI'dan öneri al…"
            className="text-xs"
            required
          />

          {saveState?.fieldErrors?.reply && (
            <p className="text-xs text-red-500">{saveState.fieldErrors.reply[0]}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setComposerOpen(false);
                setDraft(review.reply ?? "");
              }}
            >
              Vazgeç
            </Button>
            <SaveButton hasReply={!!review.reply} />
          </div>
        </form>
      )}

      {/* Cevap yoksa: 'Cevap yaz' + 'AI ile öner' */}
      {!review.reply && !composerOpen && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[color:var(--color-border)] pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startReply}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Cevap yaz
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateAI}
            disabled={aiPending}
          >
            {aiPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                AI yazıyor…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                AI ile öner
              </>
            )}
          </Button>
          {aiError && (
            <span className="self-center text-xs text-red-500">{aiError}</span>
          )}
        </div>
      )}
    </div>
  );
}

function SaveButton({ hasReply }: { hasReply: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Kaydediliyor…
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5" />
          {hasReply ? "Güncelle" : "Cevabı kaydet"}
        </>
      )}
    </Button>
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
