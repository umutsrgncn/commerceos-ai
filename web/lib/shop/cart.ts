import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Cart, CartItem, Product } from "@prisma/client";

const COOKIE_NAME = "commerceos_cart";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 gün

function randomToken(): string {
  return crypto.randomUUID();
}

/**
 * Aktif sepeti çek — cookie sessionToken ile. Yoksa yeni token üretir
 * ama DB'ye Cart oluşturmaz (sadece add'de oluşturur). Login varsa
 * customerId ile aramayı da düşün — ileride entegre edilir.
 */
async function getOrCreateSessionToken(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing) return existing;
  const token = randomToken();
  jar.set(COOKIE_NAME, token, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return token;
}

async function getSessionTokenIfExists(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

export type ShopCartItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  inStock: boolean;
  stockQuantity: number;
};

export type ShopCart = {
  items: ShopCartItem[];
  itemCount: number; // toplam adet
  subtotal: number; // kuruş
};

function firstImage(images: unknown): string | null {
  if (Array.isArray(images) && images.length > 0) {
    const f = images[0];
    if (typeof f === "string") return f;
    if (f && typeof f === "object" && "url" in f)
      return String((f as { url: unknown }).url);
  }
  return null;
}

type CartWithItems = Cart & {
  items: (CartItem & {
    product: Pick<Product, "id" | "slug" | "name" | "price" | "images"> & {
      inventory: { quantity: number } | null;
    };
  })[];
};

function toShopCart(cart: CartWithItems | null): ShopCart {
  if (!cart) return { items: [], itemCount: 0, subtotal: 0 };
  const items = cart.items.map((it) => ({
    id: it.id,
    productId: it.productId,
    slug: it.product.slug,
    name: it.product.name,
    price: it.product.price,
    quantity: it.quantity,
    imageUrl: firstImage(it.product.images),
    inStock: (it.product.inventory?.quantity ?? 0) > 0,
    stockQuantity: it.product.inventory?.quantity ?? 0,
  }));
  return {
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
  };
}

const CART_INCLUDE = {
  items: {
    orderBy: { addedAt: "desc" as const },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          images: true,
          inventory: { select: { quantity: true } },
        },
      },
    },
  },
};

/**
 * Sepet okuma — cookie varsa DB'den çek, yoksa boş döner.
 * Yeni token üretmez (read-only path).
 */
export async function readCart(): Promise<ShopCart> {
  const token = await getSessionTokenIfExists();
  if (!token) return { items: [], itemCount: 0, subtotal: 0 };
  const cart = await db.cart.findUnique({
    where: { sessionToken: token },
    include: CART_INCLUDE,
  });
  return toShopCart(cart);
}

/**
 * Sepete ürün ekle — gerekirse yeni cart + sessionToken oluşturur.
 * Aynı productId varsa quantity artırır (max stock'la sınırlı).
 */
export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<ShopCart> {
  const token = await getOrCreateSessionToken();

  // Önce ürün var mı + stoğu var mı
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      status: true,
      inventory: { select: { quantity: true } },
    },
  });
  if (!product || product.status !== "PUBLISHED") {
    throw new Error("Ürün bulunamadı veya yayında değil.");
  }

  // Cart upsert
  let cart = await db.cart.findUnique({
    where: { sessionToken: token },
    select: { id: true },
  });
  if (!cart) {
    cart = await db.cart.create({
      data: { sessionToken: token },
      select: { id: true },
    });
  }

  // Item upsert — mevcut varsa qty artır
  const existing = await db.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  const stock = product.inventory?.quantity ?? 0;
  const targetQty = Math.min(
    stock || Infinity,
    (existing?.quantity ?? 0) + quantity,
  );

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: targetQty },
    });
  } else {
    await db.cartItem.create({
      data: { cartId: cart.id, productId, quantity: Math.min(stock || quantity, quantity) },
    });
  }

  return readCart();
}

export async function updateCartItemQuantity(
  itemId: string,
  quantity: number,
): Promise<ShopCart> {
  const token = await getSessionTokenIfExists();
  if (!token) return readCart();
  if (quantity <= 0) {
    return removeCartItem(itemId);
  }
  // Sahip kontrolü + stock clamp
  const item = await db.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: { select: { sessionToken: true } },
      product: { select: { inventory: { select: { quantity: true } } } },
    },
  });
  if (!item || item.cart.sessionToken !== token) return readCart();
  const stock = item.product.inventory?.quantity ?? 0;
  const clamped = Math.min(stock || quantity, quantity);
  await db.cartItem.update({
    where: { id: itemId },
    data: { quantity: clamped },
  });
  return readCart();
}

export async function removeCartItem(itemId: string): Promise<ShopCart> {
  const token = await getSessionTokenIfExists();
  if (!token) return readCart();
  const item = await db.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: { select: { sessionToken: true } } },
  });
  if (!item || item.cart.sessionToken !== token) return readCart();
  await db.cartItem.delete({ where: { id: itemId } });
  return readCart();
}

export async function clearCart(): Promise<ShopCart> {
  const token = await getSessionTokenIfExists();
  if (!token) return readCart();
  const cart = await db.cart.findUnique({
    where: { sessionToken: token },
    select: { id: true },
  });
  if (!cart) return readCart();
  await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  return readCart();
}

/**
 * Sadece adet özeti — header badge için. Hafif sorgu.
 */
export async function cartItemCount(): Promise<number> {
  const token = await getSessionTokenIfExists();
  if (!token) return 0;
  const agg = await db.cartItem.aggregate({
    where: { cart: { sessionToken: token } },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}
