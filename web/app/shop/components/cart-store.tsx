"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  addToCartAction,
  clearCartAction,
  getCartAction,
  removeCartItemAction,
  updateCartItemAction,
} from "@/lib/shop/cart-actions";

export type CartItem = {
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

export type CartState = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
};

type CartContextValue = {
  cart: CartState;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  pending: boolean;
  add: (productId: string, qty?: number) => Promise<void>;
  update: (itemId: string, qty: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartCtx = createContext<CartContextValue | null>(null);

const EMPTY: CartState = { items: [], itemCount: 0, subtotal: 0 };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>(EMPTY);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    const c = await getCartAction();
    setCart(c);
  }, []);

  // Mount'ta hydrate
  useEffect(() => {
    refresh();
  }, [refresh]);

  async function withPending<T>(fn: () => Promise<T>): Promise<T> {
    setPending(true);
    try {
      return await fn();
    } finally {
      setPending(false);
    }
  }

  async function add(productId: string, qty = 1) {
    await withPending(async () => {
      try {
        const r = await addToCartAction(productId, qty);
        if (r.ok) {
          setCart(r.cart);
          setDrawerOpen(true);
        } else {
          console.error("[cart] addToCartAction failed:", r.error);
          alert(`Sepete eklenemedi: ${r.error}`);
        }
      } catch (e) {
        console.error("[cart] add error:", e);
        alert(`Sepete ekleme hatası: ${e instanceof Error ? e.message : "bilinmeyen"}`);
      }
    });
  }

  async function update(itemId: string, qty: number) {
    // Optimistic update
    setCart((c) => ({
      ...c,
      items: c.items.map((it) =>
        it.id === itemId ? { ...it, quantity: qty } : it,
      ),
      itemCount: c.items.reduce(
        (s, it) => s + (it.id === itemId ? qty : it.quantity),
        0,
      ),
      subtotal: c.items.reduce(
        (s, it) =>
          s + (it.id === itemId ? qty : it.quantity) * it.price,
        0,
      ),
    }));
    await withPending(async () => {
      const r = await updateCartItemAction(itemId, qty);
      if (r.ok) setCart(r.cart);
    });
  }

  async function remove(itemId: string) {
    setCart((c) => ({
      ...c,
      items: c.items.filter((it) => it.id !== itemId),
    }));
    await withPending(async () => {
      const r = await removeCartItemAction(itemId);
      if (r.ok) setCart(r.cart);
    });
  }

  async function clear() {
    await withPending(async () => {
      const r = await clearCartAction();
      if (r.ok) setCart(r.cart);
    });
  }

  return (
    <CartCtx.Provider
      value={{
        cart,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        pending,
        add,
        update,
        remove,
        clear,
        refresh,
      }}
    >
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be inside <CartProvider>");
  return ctx;
}
