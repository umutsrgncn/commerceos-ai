import type { Metadata } from "next";
import Script from "next/script";
import { DM_Serif_Display, Inter } from "next/font/google";

import "./shop.css";
import { ShopHeader } from "./components/shop-header";
import { ShopFooter } from "./components/shop-footer";
import { THEME_INIT_SCRIPT } from "./components/theme-toggle";

const sans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-shop-sans",
  display: "swap",
});

const display = DM_Serif_Display({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-shop-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pamuk Tekstil — Bahar 2026",
  description:
    "Düşünülmüş kumaş, sade kesim. Pamuklu giyim ve ev tekstili koleksiyonu.",
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* FOUC önleme — ilk paint öncesi data-theme attribute'unu html'e koyar */}
      <Script
        id="shop-theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
      />
      <div
        data-shop="true"
        className={`${sans.variable} ${display.variable} min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-fg)] antialiased`}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <ShopHeader />
        <main className="min-h-[60vh]">{children}</main>
        <ShopFooter />
      </div>
    </>
  );
}
