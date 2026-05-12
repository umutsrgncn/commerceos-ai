"use server";

import { revalidatePath } from "next/cache";
import {
  addToCart,
  clearCart,
  readCart,
  removeCartItem,
  updateCartItemQuantity,
} from "./cart";

function revalidateCart() {
  revalidatePath("/shop");
  revalidatePath("/shop/cart");
}

export async function addToCartAction(productId: string, quantity = 1) {
  try {
    const cart = await addToCart(productId, quantity);
    revalidateCart();
    return { ok: true as const, cart };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Sepete ekleme hatası",
    };
  }
}

export async function updateCartItemAction(itemId: string, quantity: number) {
  const cart = await updateCartItemQuantity(itemId, quantity);
  revalidateCart();
  return { ok: true as const, cart };
}

export async function removeCartItemAction(itemId: string) {
  const cart = await removeCartItem(itemId);
  revalidateCart();
  return { ok: true as const, cart };
}

export async function clearCartAction() {
  const cart = await clearCart();
  revalidateCart();
  return { ok: true as const, cart };
}

export async function getCartAction() {
  return readCart();
}
