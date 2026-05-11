"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/shop/c/tisort", label: "Tişört" },
  { href: "/shop/c/pantolon", label: "Pantolon" },
  { href: "/shop/c/ayakkabi", label: "Ayakkabı" },
  { href: "/shop/c/canta", label: "Çanta" },
  { href: "/shop/c/aksesuar", label: "Aksesuar" },
  { href: "/shop/c/ev-tekstili", label: "Ev tekstili" },
];

export function ShopHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-[color:var(--color-bg)]/85 backdrop-blur-md shadow-[0_1px_0_0_var(--color-border)]"
          : "bg-transparent",
      )}
    >
      {/* Üst announcement bandı */}
      <div className="border-b border-[color:var(--color-border)]/70 bg-[color:var(--color-accent)]/[0.06] text-[10px] sm:text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-2 text-[color:var(--color-accent)]">
          <span className="font-medium">
            Bahar koleksiyonu yayında · 750₺ üzeri ücretsiz kargo
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:py-5">
        {/* Sol — menü toggle (mobile) + logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-md hover:bg-[color:var(--color-fg)]/[0.05] lg:hidden"
            aria-label="Menü"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link
            href="/shop"
            className="font-display text-2xl italic leading-none tracking-tight sm:text-[28px]"
          >
            Pamuk
            <span className="text-[color:var(--color-accent)]">.</span>
          </Link>
        </div>

        {/* Orta — nav (desktop) */}
        <nav className="hidden flex-1 items-center justify-center gap-7 text-[13px] lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href as never}
              className="shop-link font-medium text-[color:var(--color-fg)]/80 hover:text-[color:var(--color-fg)]"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Sağ — arama + hesap + sepet */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/shop/search"
            className="grid h-9 w-9 place-items-center rounded-md hover:bg-[color:var(--color-fg)]/[0.05]"
            aria-label="Ara"
          >
            <Search className="h-4 w-4" />
          </Link>
          <Link
            href="/shop/account/wishlist"
            className="hidden h-9 w-9 place-items-center rounded-md hover:bg-[color:var(--color-fg)]/[0.05] sm:grid"
            aria-label="Favoriler"
          >
            <Heart className="h-4 w-4" />
          </Link>
          <Link
            href="/shop/account"
            className="grid h-9 w-9 place-items-center rounded-md hover:bg-[color:var(--color-fg)]/[0.05]"
            aria-label="Hesabım"
          >
            <User className="h-4 w-4" />
          </Link>
          <Link
            href="/shop/cart"
            className="relative grid h-9 w-9 place-items-center rounded-md hover:bg-[color:var(--color-fg)]/[0.05]"
            aria-label="Sepet"
          >
            <ShoppingBag className="h-4 w-4" />
            {/* TODO: badge count — Phase 2 cart wiring */}
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-[color:var(--color-bg)] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link
                href="/shop"
                onClick={() => setMobileOpen(false)}
                className="font-display text-2xl italic"
              >
                Pamuk<span className="text-[color:var(--color-accent)]">.</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-[color:var(--color-fg)]/[0.05]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-8 space-y-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href as never}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium hover:bg-[color:var(--color-fg)]/[0.05]"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 space-y-1 border-t border-[color:var(--color-border)] pt-4">
              <Link
                href="/shop/account"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.05]"
              >
                Hesabım
              </Link>
              <Link
                href="/shop/account/orders"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.05]"
              >
                Siparişlerim
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
