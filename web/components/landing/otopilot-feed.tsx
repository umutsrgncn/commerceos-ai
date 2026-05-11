"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Banknote,
  Bot,
  CheckCircle2,
  MessageSquare,
  Package,
  Receipt,
  Sparkles,
  Tag,
  UserCircle,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Event = {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  detail: string;
  ago: string;
};

const EVENTS: Event[] = [
  {
    icon: MessageSquare,
    color: "amber",
    title: "Yorum cevabı yazıldı",
    detail: "Aslı Çelik · 3★ · iade süreci hakkında bilgi verildi",
    ago: "az önce",
  },
  {
    icon: Receipt,
    color: "emerald",
    title: "E-fatura kesildi",
    detail: "ORD-202605-00448 → EAR2026000448 · GİB onayladı",
    ago: "12 sn",
  },
  {
    icon: Banknote,
    color: "blue",
    title: "Havale eşleşti",
    detail: "₺2.116,92 → ORD-202605-00458 · güven %97",
    ago: "34 sn",
  },
  {
    icon: Package,
    color: "indigo",
    title: "Tedarikçi maili gönderildi",
    detail: "PT-ESOFMAN-ALTI-GRI · 50 adet · Tekstilcim A.Ş.",
    ago: "1 dk",
  },
  {
    icon: UserCircle,
    color: "purple",
    title: "Müşteri segmentlendi",
    detail: "Ada Yıldız → VIP · 13 sipariş · 7 günde",
    ago: "2 dk",
  },
  {
    icon: Tag,
    color: "pink",
    title: "Fiyat önerisi",
    detail: "BS-TS-001 ₺249,90 → ₺199,00 (-%20) · 90g satışsız",
    ago: "3 dk",
  },
  {
    icon: AlertTriangle,
    color: "red",
    title: "Anomali tespit edildi",
    detail: "İade oranı %14 (baseline %5.2) · admin'e bildirildi",
    ago: "5 dk",
  },
];

const ACCENT: Record<string, string> = {
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  blue: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
  purple: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  pink: "bg-pink-500/15 text-pink-300 border-pink-500/25",
  red: "bg-red-500/15 text-red-300 border-red-500/25",
};

export function OtopilotHeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/40 via-black to-indigo-950/30 p-6 sm:p-10">
      {/* Background grid */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
        aria-hidden
      >
        <defs>
          <pattern id="otopilot-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path
              d="M 36 0 L 0 0 0 36"
              fill="none"
              stroke="rgba(217,70,239,0.4)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#otopilot-grid)" />
      </svg>

      {/* Glow orbs */}
      <motion.div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/80" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Otopilot · AKTİF
        </div>

        <h2 className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          AI günlük operasyonu{" "}
          <span className="bg-gradient-to-br from-fuchsia-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
            paralel yönetir
          </span>
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-sm text-white/65 sm:text-base">
          Yorum geldiğinde cevap yazar, sipariş onaylanınca fatura keser, stok
          azalınca tedarikçiye yazar — hepsi <strong className="text-white">aynı
          anda, arka planda</strong>. Sen sadece akışı izlersin.
        </p>

        {/* Capability chips */}
        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {[
            { label: "Yorum cevabı", color: "amber" },
            { label: "E-fatura", color: "emerald" },
            { label: "Havale eşleştirme", color: "blue" },
            { label: "Stok sipariş", color: "indigo" },
            { label: "Segmentasyon", color: "purple" },
            { label: "Fiyat önerisi", color: "pink" },
            { label: "Anomali tespit", color: "red" },
          ].map((c, i) => (
            <motion.span
              key={c.label}
              initial={{ scale: 0.85 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: "backOut" }}
              whileHover={{ scale: 1.05 }}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${ACCENT[c.color]}`}
            >
              <Zap className="h-2.5 w-2.5" />
              {c.label}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stable initial set (5 event); auto-mode adds new ones to the top.
// Listede en fazla 6 event kalır — yenisi gelince en eski düşer.
export function OtopilotLiveFeed() {
  // Her event'e stable id ver (key için)
  const initial = EVENTS.slice(0, 5).map((e, i) => ({
    ...e,
    id: `seed-${i}-${e.title}`,
  }));
  const [feed, setFeed] = useState(initial);
  const counterRef = useRef(0);

  // Her 7sn'de bir rastgele yeni event üstten girer
  useEffect(() => {
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * EVENTS.length);
      const base = EVENTS[idx];
      counterRef.current += 1;
      const newEvent = {
        ...base,
        ago: "şimdi",
        id: `live-${counterRef.current}`,
      };
      setFeed((prev) => {
        // Eskileri "X sn önce"ye kaydır (gevşek simülasyon)
        const aged = prev.map((p, i) => ({
          ...p,
          ago: i === 0 ? "az önce" : i === 1 ? "1 dk" : `${i + 1} dk`,
        }));
        return [newEvent, ...aged].slice(0, 6);
      });
    }, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-white/55">
          <Bot className="h-3.5 w-3.5 text-fuchsia-300" />
          <span className="font-medium">Otopilot · Canlı feed</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/40">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
          </span>
          son 7 dk · {feed.length} aksiyon
        </div>
      </div>

      <ul className="divide-y divide-white/[0.04]">
        <AnimatePresence initial={false}>
          {feed.map((e) => {
            const Icon = e.icon;
            return (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex items-start gap-3 px-4 py-3 transition hover:bg-white/[0.02]"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${ACCENT[e.color]}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{e.title}</span>
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                  </div>
                  <div className="mt-0.5 text-xs text-white/55">
                    {e.detail}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-[10px] text-white/35">
                  {e.ago}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export function OtopilotShowcase({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>
  );
}

export function OtopilotCard({ children }: { children: React.ReactNode }) {
  // motion.div + scale-only hover ile — opacity hiç 0'a düşmez
  return (
    <motion.div
      initial={{ y: 12 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4 }}
    >
      {children}
    </motion.div>
  );
}

export function PulseBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      LIVE
    </span>
  );
}

void Sparkles;
