import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type InventoryListFilters = {
  q?: string;
  onlyLow?: boolean;
};

export async function listInventory(filters: InventoryListFilters = {}) {
  const { q, onlyLow } = filters;

  const where: Prisma.ProductWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(onlyLow
      ? {
          inventory: {
            is: { quantity: { lte: db.inventory.fields.reorderLevel } },
          },
        }
      : {}),
  };

  return db.product.findMany({
    where,
    orderBy: [{ status: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      sku: true,
      status: true,
      currency: true,
      inventory: {
        select: {
          id: true,
          quantity: true,
          reserved: true,
          reorderLevel: true,
          updatedAt: true,
        },
      },
    },
  });
}

export async function listLowStock(limit = 10) {
  // Prisma can't compare two columns of the same row in a where; raw query.
  const rows = await db.$queryRaw<
    Array<{
      id: string;
      name: string;
      sku: string;
      quantity: number;
      reorderLevel: number;
    }>
  >`
    SELECT p.id, p.name, p.sku, i.quantity, i."reorderLevel"
    FROM "Product" p
    JOIN "Inventory" i ON i."productId" = p.id
    WHERE p.status = 'PUBLISHED' AND i.quantity <= i."reorderLevel"
    ORDER BY (i."reorderLevel" - i.quantity) DESC
    LIMIT ${limit}
  `;
  return rows;
}

export async function recentAdjustments(productId: string, limit = 20) {
  return db.inventoryAdjustment.findMany({
    where: { inventory: { productId } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
