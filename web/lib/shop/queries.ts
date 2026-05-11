import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Shop (müşteri tarafı) sorguları — tüm sorgular sadece PUBLISHED ürünleri
 * döndürür. Admin sorgu katmanından izole.
 */

const PUBLIC_STATUS: Prisma.ProductWhereInput = { status: "PUBLISHED" };

function firstImage(imagesJson: unknown): string | null {
  if (Array.isArray(imagesJson) && imagesJson.length > 0) {
    const first = imagesJson[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) {
      return String((first as { url: unknown }).url);
    }
  }
  return null;
}

export type ShopProductSummary = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAt: number | null;
  imageUrl: string | null;
  category: { slug: string; name: string } | null;
  inStock: boolean;
};

function toSummary(p: {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: unknown;
  category: { slug: string; name: string } | null;
  inventory: { quantity: number } | null;
}): ShopProductSummary {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAt: null,
    imageUrl: firstImage(p.images),
    category: p.category,
    inStock: (p.inventory?.quantity ?? 0) > 0,
  };
}

export async function listShopProducts(opts: {
  categorySlug?: string;
  search?: string;
  sort?: "new" | "price-asc" | "price-desc" | "popular";
  page?: number;
  pageSize?: number;
}): Promise<{ items: ShopProductSummary[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.max(1, Math.min(60, opts.pageSize ?? 24));

  const where: Prisma.ProductWhereInput = {
    ...PUBLIC_STATUS,
    ...(opts.categorySlug
      ? { category: { slug: opts.categorySlug } }
      : {}),
    ...(opts.search
      ? {
          OR: [
            { name: { contains: opts.search, mode: "insensitive" } },
            { description: { contains: opts.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    opts.sort === "price-asc"
      ? { price: "asc" }
      : opts.sort === "price-desc"
        ? { price: "desc" }
        : opts.sort === "popular"
          ? { orderItems: { _count: "desc" } }
          : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        images: true,
        category: { select: { slug: true, name: true } },
        inventory: { select: { quantity: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return {
    items: items.map(toSummary),
    total,
    page,
    pageSize,
  };
}

export async function getShopProductBySlug(slug: string) {
  const p = await db.product.findFirst({
    where: { slug, ...PUBLIC_STATUS },
    select: {
      id: true,
      slug: true,
      name: true,
      sku: true,
      description: true,
      price: true,
      currency: true,
      images: true,
      category: { select: { id: true, slug: true, name: true } },
      inventory: { select: { quantity: true, reorderLevel: true } },
      reviews: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          authorName: true,
          rating: true,
          body: true,
          reply: true,
          createdAt: true,
        },
      },
    },
  });
  if (!p) return null;

  // Rating aggregate
  const agg = await db.productReview.aggregate({
    where: { productId: p.id, isPublished: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const images: string[] = Array.isArray(p.images)
    ? p.images
        .map((x) =>
          typeof x === "string"
            ? x
            : x && typeof x === "object" && "url" in x
              ? String((x as { url: unknown }).url)
              : null,
        )
        .filter((x): x is string => !!x)
    : [];

  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    description: p.description,
    price: p.price,
    currency: p.currency,
    images,
    category: p.category,
    inStock: (p.inventory?.quantity ?? 0) > 0,
    stockQuantity: p.inventory?.quantity ?? 0,
    rating: {
      average: agg._avg.rating ?? null,
      count: agg._count._all,
    },
    reviews: p.reviews,
  };
}

export async function listRelatedProducts(productId: string, categoryId: string | null, limit = 4) {
  if (!categoryId) return [];
  const items = await db.product.findMany({
    where: {
      ...PUBLIC_STATUS,
      categoryId,
      NOT: { id: productId },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      images: true,
      category: { select: { slug: true, name: true } },
      inventory: { select: { quantity: true } },
    },
  });
  return items.map(toSummary);
}

export async function listShopCategories() {
  const cats = await db.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      imageUrl: true,
      _count: { select: { products: { where: PUBLIC_STATUS } } },
    },
  });
  return cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    imageUrl: c.imageUrl,
    productCount: c._count.products,
  }));
}

export async function getShopCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, description: true, imageUrl: true },
  });
}

export async function getFeaturedProducts(limit = 8): Promise<ShopProductSummary[]> {
  const items = await db.product.findMany({
    where: PUBLIC_STATUS,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      images: true,
      category: { select: { slug: true, name: true } },
      inventory: { select: { quantity: true } },
    },
  });
  return items.map(toSummary);
}
