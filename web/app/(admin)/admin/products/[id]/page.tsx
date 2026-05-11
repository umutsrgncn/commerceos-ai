import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Sparkles, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProductById } from "@/lib/queries/products";
import { listCategoryOptions } from "@/lib/queries/categories";
import { deleteProductAction } from "@/lib/actions/products";
import {
  getReviewStats,
  listReviewsForProduct,
} from "@/lib/queries/reviews";
import { cn } from "@/lib/cn";
import { ProductForm } from "../components/product-form";
import { ReviewList } from "../components/review-list";
import { ReviewAiPanel } from "../components/review-ai-panel";
import { PricingAiCard } from "../components/pricing-ai-card";

export const metadata = { title: "Ürün — CommerceOS" };

const PREVIEW_LIMIT = 5;

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, reviews, reviewStats] = await Promise.all([
    getProductById(id),
    listCategoryOptions(),
    listReviewsForProduct(id, PREVIEW_LIMIT),
    getReviewStats(id),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/products"
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ArrowLeft className="inline h-4 w-4" /> Ürünler
        </Link>

        <form action={deleteProductAction}>
          <input type="hidden" name="id" value={product.id} />
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          SKU <span className="font-mono">{product.sku}</span>
        </p>
      </div>

      <ProductForm
        mode="edit"
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          description: product.description,
          price: product.price,
          costPrice: product.costPrice,
          currency: product.currency,
          status: product.status,
          categoryId: product.categoryId,
          images: Array.isArray(product.images)
            ? (product.images as string[]).filter((u) => typeof u === "string")
            : [],
        }}
      />

      {/* AI Fiyat Önerisi */}
      <PricingAiCard
        productId={product.id}
        hasCostPrice={product.costPrice != null}
      />

      {/* Yorumlar önizleme + AI özet */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-[color:var(--color-border)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Yorumlar</CardTitle>
                <CardDescription>
                  {reviewStats.total} yorum · ortalama{" "}
                  {reviewStats.average.toFixed(1)} / 5
                  {reviewStats.total > PREVIEW_LIMIT &&
                    ` · son ${PREVIEW_LIMIT} gösteriliyor`}
                </CardDescription>
              </div>
              <RatingSummary stats={reviewStats} />
            </div>
          </CardHeader>
          <CardContent>
            <ReviewList
              reviews={reviews.map((r) => ({
                id: r.id,
                productId: r.productId,
                authorName: r.authorName,
                authorEmail: r.authorEmail,
                rating: r.rating,
                body: r.body,
                isPublished: r.isPublished,
                createdAt: r.createdAt,
              }))}
            />
            {reviewStats.total > 0 && (
              <div className="mt-3 border-t border-[color:var(--color-border)] pt-3 text-right">
                <Link
                  href={`/admin/reviews?productId=${product.id}`}
                  className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:underline"
                >
                  Bu ürünün tüm yorumları
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-fuchsia-500" />
              AI ile özet
            </CardTitle>
            <CardDescription>
              Tüm yorumlardan tema + sentiment + aksiyon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewAiPanel
              productId={product.id}
              reviewCount={reviewStats.total}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RatingSummary({
  stats,
}: {
  stats: { total: number; average: number; counts: number[] };
}) {
  if (stats.total === 0) {
    return (
      <div className="text-xs text-[color:var(--color-muted)]">
        Henüz puan yok
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums">
            {stats.average.toFixed(1)}
          </span>
          <span className="text-xs text-[color:var(--color-muted)]">/ 5</span>
        </div>
        <div className="text-[10px] text-[color:var(--color-muted)]">
          {stats.total} yorum
        </div>
      </div>
      <div className="hidden w-32 sm:block">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.counts[star - 1] ?? 0;
          const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-1.5 py-0.5">
              <span className="flex w-3 items-center text-[10px] text-[color:var(--color-muted)]">
                {star}
                <Star className="ml-0.5 h-2 w-2 fill-amber-400 text-amber-400" />
              </span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--color-fg)]/[0.06]">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-amber-400"
                  )}
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
              <span className="w-4 text-right text-[10px] tabular-nums text-[color:var(--color-muted)]">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
