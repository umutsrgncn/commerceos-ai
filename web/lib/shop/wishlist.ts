import "server-only";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "./auth";

export async function listMyWishlist() {
  const customer = await getCurrentCustomer();
  if (!customer) return [];
  return db.wishlist.findMany({
    where: { customerId: customer.id },
    orderBy: { addedAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          images: true,
          status: true,
          inventory: { select: { quantity: true } },
        },
      },
    },
  });
}

/** Tek bir ürünün favori durumu */
export async function isInWishlist(productId: string): Promise<boolean> {
  const customer = await getCurrentCustomer();
  if (!customer) return false;
  const w = await db.wishlist.findUnique({
    where: { customerId_productId: { customerId: customer.id, productId } },
    select: { id: true },
  });
  return !!w;
}

/** Bir grup productId için favori map'i — kategori/grid sayfaları için */
export async function wishlistMapFor(productIds: string[]): Promise<Set<string>> {
  const customer = await getCurrentCustomer();
  if (!customer || productIds.length === 0) return new Set();
  const list = await db.wishlist.findMany({
    where: { customerId: customer.id, productId: { in: productIds } },
    select: { productId: true },
  });
  return new Set(list.map((w) => w.productId));
}

export async function addToWishlist(productId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return { ok: false, needsAuth: true } as const;
  // Ürün geçerli mi
  const p = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, status: true },
  });
  if (!p) return { ok: false, error: "Ürün bulunamadı" } as const;
  try {
    await db.wishlist.create({
      data: { customerId: customer.id, productId },
    });
  } catch {
    // Zaten var — sessizce geç
  }
  return { ok: true, active: true } as const;
}

export async function removeFromWishlist(productId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return { ok: false, needsAuth: true } as const;
  await db.wishlist.deleteMany({
    where: { customerId: customer.id, productId },
  });
  return { ok: true, active: false } as const;
}

export async function toggleWishlist(productId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return { ok: false, needsAuth: true } as const;
  const existing = await db.wishlist.findUnique({
    where: { customerId_productId: { customerId: customer.id, productId } },
    select: { id: true },
  });
  if (existing) {
    await db.wishlist.delete({ where: { id: existing.id } });
    return { ok: true, active: false } as const;
  }
  await db.wishlist.create({
    data: { customerId: customer.id, productId },
  });
  return { ok: true, active: true } as const;
}
