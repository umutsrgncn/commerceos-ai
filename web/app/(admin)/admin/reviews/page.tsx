import Link from "next/link";
import { MessageSquare, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getOverallReviewStats,
  listAllReviews,
} from "@/lib/queries/reviews";
import { cn } from "@/lib/cn";
import { ReviewCard } from "./components/review-card";
import { ReviewsFilters } from "./components/reviews-filters";

export const metadata = { title: "Yorumlar — CommerceOS" };

const PAGE_SIZE = 20;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    rating?: string;
    published?: string;
    page?: string;
    productId?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const ratingNum = Number(params.rating);
  const rating =
    ratingNum >= 1 && ratingNum <= 5 ? ratingNum : undefined;
  const isPublished =
    params.published === "1"
      ? true
      : params.published === "0"
        ? false
        : undefined;

  const [data, stats] = await Promise.all([
    listAllReviews({
      q: params.q,
      rating,
      isPublished,
      productId: params.productId,
      page,
      pageSize: PAGE_SIZE,
    }),
    getOverallReviewStats(),
  ]);

  const pageCount = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Yorumlar</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Tüm ürünlere gelen yorumları yönet — yayınla/taslağa al, AI ile
          cevap önerisi al.
        </p>
      </div>

      {/* Hero stat — ortalama + dağılım */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-5">
            <div>
              <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                Ortalama puan
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tabular-nums">
                  {stats.average.toFixed(1)}
                </span>
                <span className="text-sm text-[color:var(--color-muted)]">
                  / 5
                </span>
              </div>
              <div className="mt-1 text-xs text-[color:var(--color-muted)]">
                {stats.total} yayında
                {stats.draftCount > 0 && ` · ${stats.draftCount} taslak`}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.counts[star - 1] ?? 0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="flex w-7 items-center text-xs text-[color:var(--color-muted)]">
                      {star}
                      <Star className="ml-1 h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--color-fg)]/[0.06]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-amber-400"
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs tabular-nums text-[color:var(--color-muted)]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <ReviewsFilters />

      {data.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Bu filtreyle yorum yok</h3>
              <p className="text-sm text-[color:var(--color-muted)]">
                Filtreleri sıfırla veya ürün detayından elle yorum ekle.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((review) => (
            <ReviewCard
              key={review.id}
              review={{
                id: review.id,
                rating: review.rating,
                body: review.body,
                authorName: review.authorName,
                authorEmail: review.authorEmail,
                isPublished: review.isPublished,
                reply: review.reply,
                repliedAt: review.repliedAt,
                createdAt: review.createdAt,
                product: {
                  id: review.product.id,
                  name: review.product.name,
                  sku: review.product.sku,
                  images: review.product.images,
                },
              }}
            />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[color:var(--color-muted)]">
            Sayfa {page} / {pageCount} · {data.total} yorum
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildPageHref(params, page - 1)}>
                <Button variant="outline" size="sm">
                  Önceki
                </Button>
              </Link>
            )}
            {page < pageCount && (
              <Link href={buildPageHref(params, page + 1)}>
                <Button variant="outline" size="sm">
                  Sonraki
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function buildPageHref(
  params: { q?: string; rating?: string; published?: string; productId?: string },
  page: number
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.rating) sp.set("rating", params.rating);
  if (params.published) sp.set("published", params.published);
  if (params.productId) sp.set("productId", params.productId);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/admin/reviews${qs ? `?${qs}` : ""}` as `/admin/reviews${string}`;
}
