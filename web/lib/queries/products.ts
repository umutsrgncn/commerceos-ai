import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ProductStatusValue } from "@/lib/schemas/products";

export type ProductListFilters = {
  q?: string;
  status?: ProductStatusValue;
  categoryId?: string;
  page?: number;
  pageSize?: number;
};

export async function listProducts(filters: ProductListFilters = {}) {
  const { q, status, categoryId, page = 1, pageSize = 20 } = filters;

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
      orderBy: { updatedAt: "desc" },
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
