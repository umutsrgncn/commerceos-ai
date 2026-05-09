import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ProductStatusValue } from "@/lib/schemas/products";

export type ProductSort =
  | "updated_desc"
  | "updated_asc"
  | "created_desc"
  | "created_asc"
  | "price_desc"
  | "price_asc"
  | "name_asc";

const PRODUCT_ORDER_BY: Record<ProductSort, Prisma.ProductOrderByWithRelationInput> = {
  updated_desc: { updatedAt: "desc" },
  updated_asc: { updatedAt: "asc" },
  created_desc: { createdAt: "desc" },
  created_asc: { createdAt: "asc" },
  price_desc: { price: "desc" },
  price_asc: { price: "asc" },
  name_asc: { name: "asc" },
};

export type ProductListFilters = {
  q?: string;
  status?: ProductStatusValue;
  categoryId?: string;
  page?: number;
  pageSize?: number;
  sort?: ProductSort;
};

export async function listProducts(filters: ProductListFilters = {}) {
  const {
    q,
    status,
    categoryId,
    page = 1,
    pageSize = 20,
    sort = "updated_desc",
  } = filters;

  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        inventory: { select: { quantity: true } },
      },
      orderBy: PRODUCT_ORDER_BY[sort] ?? PRODUCT_ORDER_BY.updated_desc,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getProductById(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      category: true,
      inventory: true,
    },
  });
}

export async function listCategoriesFlat() {
  return db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, parentId: true },
  });
}
