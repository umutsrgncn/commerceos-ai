"use client";

/**
 * /watch sayfası için yan akan feature marquee'leri.
 *
 * Sol şerit yukarı, sağ şerit aşağı kayar. CSS-only (kütüphane yok).
 * 12 özellik chip'i 4 kategoride.
 */
import {
  Banknote,
  Bot,
  Brain,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  Hammer,
  Heart,
  Mail,
  MessageSquare,
  Package,
  Receipt,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";

type Chip = {
  icon: ComponentType<{ className?: string }>;
  text: string;
  accent: "indigo" | "fuchsia" | "emerald" | "amber" | "sky" | "rose";
};

const ACCENT: Record<Chip["accent"], string> = {
  indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-200",
  fuchsia: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-200",
};

const COLUMNS: Chip[][] = [
  // Column 1 (left, scrolls up)
  [
    { icon: Brain, text: "AI sipariş tahmin", accent: "indigo" },
    { icon: Bot, text: "Otopilot 7 görev", accent: "fuchsia" },
    { icon: Receipt, text: "GİB e-fatura", accent: "emerald" },
    { icon: Banknote, text: "Havale eşleştirme", accent: "sky" },
    { icon: ShieldCheck, text: "KVKK uyumlu", accent: "rose" },
    { icon: Tag, text: "AI fiyatlama", accent: "amber" },
    { icon: MessageSquare, text: "Yorum cevabı", accent: "fuchsia" },
    { icon: Search, text: "Doğal dil sorgu", accent: "indigo" },
    { icon: ClipboardList, text: "23 yazılabilir scope", accent: "emerald" },
    { icon: Mail, text: "Kampanya yazımı", accent: "amber" },
  ],
  // Column 2 (right, scrolls down)
  [
    { icon: Hammer, text: "AI geliştirici", accent: "fuchsia" },
    { icon: TrendingUp, text: "Finans tahmini", accent: "emerald" },
    { icon: Users, text: "AI segmentasyon", accent: "indigo" },
    { icon: ShoppingCart, text: "Sepet → sipariş", accent: "sky" },
    { icon: Wand2, text: "Ürün açıklama AI", accent: "fuchsia" },
    { icon: Zap, text: "Anomali tespiti", accent: "rose" },
    { icon: Package, text: "Stok yenileme", accent: "amber" },
    { icon: Sparkles, text: "Gemini 2.5 Pro+Flash", accent: "indigo" },
    { icon: CreditCard, text: "iyzico 3DS", accent: "emerald" },
    { icon: FileText, text: "E-Arşiv otomatik", accent: "sky" },
    { icon: Heart, text: "Favori grid'i", accent: "rose" },
    { icon: CheckCircle2, text: "Playwright e2e", accent: "emerald" },
  ],
];

export function WatchMarquees() {
  return (
    <>
      <style>{`
        @keyframes marquee-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes marquee-down {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        .marquee-track-up { animation: marquee-up 40s linear infinite; }
        .marquee-track-down { animation: marquee-down 38s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track-up, .marquee-track-down { animation: none; }
        }
      `}</style>

      {/* Sol şerit — yukarı kayar */}
      <MarqueeColumn chips={COLUMNS[0]} direction="up" side="left" />

      {/* Sağ şerit — aşağı kayar */}
      <MarqueeColumn chips={COLUMNS[1]} direction="down" side="right" />
    </>
  );
}

function MarqueeColumn({
  chips,
  direction,
  side,
}: {
  chips: Chip[];
  direction: "up" | "down";
  side: "left" | "right";
}) {
  // İki kez yan yana koyarak sonsuz döngü hissi
  const doubled = [...chips, ...chips];
  return (
    <div
      className={`pointer-events-none absolute top-0 hidden h-full w-[180px] overflow-hidden lg:block ${
        side === "left" ? "left-3 xl:left-8" : "right-3 xl:right-8"
      }`}
      aria-hidden
    >
      {/* Fade top/bottom */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black to-transparent" />

      <div
        className={`flex flex-col gap-3 ${
          direction === "up" ? "marquee-track-up" : "marquee-track-down"
        }`}
      >
        {doubled.map((c, i) => (
          <div
            key={`${side}-${i}`}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-medium backdrop-blur ${ACCENT[c.accent]}`}
          >
            <c.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{c.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
