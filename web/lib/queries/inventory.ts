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
      images: true,
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

/**
 * Yavaş hareket eden stok — son N gün satış adedi <= eşik olan,
 * ama stokta kayıt sayısı > 0 olan PUBLISHED ürünler.
 *
 * Bağlı sermaye = quantity * costPrice (maliyet yoksa 0 yazılır,
 * UI uyarır).
 */
export async function listSlowMovingStock(input?: {
  daysBack?: number; // satış penceresi
  maxSold?: number; // bu adetin altı yavaş sayılır
  limit?: number;
}) {
  const daysBack = input?.daysBack ?? 30;
  const maxSold = input?.maxSold ?? 1; // <= 1 adet → yavaş
  const limit = input?.limit ?? 20;

  // Raw SQL — Prisma'nın aggregation'ları ile bunu birleştirmek zor.
  type Row = {
    id: string;
    name: string;
    sku: string;
    price: number;
    cost_price: number | null;
    images: unknown;
    quantity: number;
    sold_in_window: bigint | number;
    last_sale_date: Date | null;
    days_since_last_sale: number | null;
  };

  const rows = await db.$queryRaw<Row[]>`
    SELECT
      p.id,
      p.name,
      p.sku,
      p.price,
      p."costPrice" AS cost_price,
      p.images,
      i.quantity,
      COALESCE(s.sold_in_window, 0) AS sold_in_window,
      s.last_sale_date,
      CASE
        WHEN s.last_sale_date IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM NOW() - s.last_sale_date)::int
      END AS days_since_last_sale
    FROM "Product" p
    INNER JOIN "Inventory" i ON i."productId" = p.id
    LEFT JOIN (
      SELECT
        oi."productId",
        SUM(oi.quantity) AS sold_in_window,
        MAX(o."createdAt") AS last_sale_date
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
        AND o."createdAt" >= NOW() - INTERVAL '${Prisma.raw(String(daysBack))} days'
      GROUP BY oi."productId"
    ) s ON s."productId" = p.id
    WHERE p.status = 'PUBLISHED'
      AND i.quantity > 0
      AND COALESCE(s.sold_in_window, 0) <= ${maxSold}
    ORDER BY
      i.quantity DESC,
      s.last_sale_date ASC NULLS FIRST
    LIMIT ${limit}
  `;

  return rows.map((r) => {
    const cost = r.cost_price;
    const tiedCapital =
      cost != null && cost > 0 ? r.quantity * cost : null;
    const images =
      Array.isArray(r.images) && typeof r.images[0] === "string"
        ? (r.images[0] as string)
        : null;
    return {
      id: r.id,
      name: r.name,
      sku: r.sku,
      price: r.price,
      costPrice: cost,
      image: images,
      quantity: r.quantity,
      soldInWindow: Number(r.sold_in_window),
      lastSaleDate: r.last_sale_date,
      daysSinceLastSale: r.days_since_last_sale,
      tiedCapitalMinor: tiedCapital,
    };
  });
}

export type SlowMovingItem = Awaited<
  ReturnType<typeof listSlowMovingStock>
>[number];
