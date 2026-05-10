import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function listReviewsForProduct(productId: string, limit = 50) {
  return db.productReview.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export type ReviewListFilters = {
  productId?: string;
  rating?: number;
  isPublished?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listAllReviews(filters: ReviewListFilters = {}) {
  const {
    productId,
    rating,
    isPublished,
    q,
    page = 1,
    pageSize = 20,
  } = filters;

  const where: Prisma.ProductReviewWhereInput = {
    ...(productId ? { productId } : {}),
    ...(typeof rating === "number" ? { rating } : {}),
    ...(typeof isPublished === "boolean" ? { isPublished } : {}),
    ...(q
      ? {
          OR: [
            { authorName: { contains: q, mode: "insensitive" } },
            { body: { contains: q, mode: "insensitive" } },
            { product: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.productReview.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true, images: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.productReview.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getReviewById(id: string) {
  return db.productReview.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, sku: true } },
    },
  });
}

export async function getOverallReviewStats() {
  const grouped = await db.productReview.groupBy({
    by: ["rating"],
    where: { isPublished: true },
    _count: { _all: true },
  });

  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
  const sumRatings = grouped.reduce(
    (sum, g) => sum + g.rating * g._count._all,
    0
  );
  const average = total > 0 ? sumRatings / total : 0;
  const counts = [0, 0, 0, 0, 0];
  for (const g of grouped) {
    counts[g.rating - 1] = g._count._all;
  }
  const draftCount = await db.productReview.count({
    where: { isPublished: false },
  });

  return { total, average, counts, draftCount };
}

export async function getReviewStats(productId: string) {
  const grouped = await db.productReview.groupBy({
    by: ["rating"],
    where: { productId, isPublished: true },
    _count: { _all: true },
  });

  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
  const sumRatings = grouped.reduce(
    (sum, g) => sum + g.rating * g._count._all,
    0
  );
  const average = total > 0 ? sumRatings / total : 0;

  // Sayım dizisi: index 0 = 1 yıldız, index 4 = 5 yıldız
  const counts = [0, 0, 0, 0, 0];
  for (const g of grouped) {
    counts[g.rating - 1] = g._count._all;
  }

  return { total, average, counts };
}
