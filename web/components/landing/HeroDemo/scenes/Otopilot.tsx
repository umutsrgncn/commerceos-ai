"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Sayı değişimi pulse rengi — sade span, layout shift yok */
function AnimatedNumber({ value }: { value: number }) {
  const [pulse, setPulse] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 450);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <span
      className={`inline-block transition-colors duration-300 ${
        pulse ? "text-fuchsia-300" : "text-white"
      }`}
    >
      {value}
    </span>
  );
}
import {
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Receipt,
  Banknote,
  Package,
  Users,
  Tag,
  AlertTriangle,
} from "lucide-react";

/**
 * Otopilot sahnesi — kendi kendine 7 trigger sırayla tetiklenir.
 * Demo simülatör butonları yok; her trigger "Olay → AI aksiyon" formatında.
 */

type FeedItem = {
  trigger: string;
  triggerIcon: typeof MessageSquare;
  action: string;
  meta: string;
  iconCls: string;
  type: string;
};

const TRIGGERS: FeedItem[] = [
  {
    trigger: "Yeni yorum geldi · Aslı Çelik · 3★",
    triggerIcon: MessageSquare,
    action: "AI cevap yazdı + yayınladı",
    meta: "REVIEW_REPLY · 14sn · güven %92",
    iconCls: "text-amber-300 bg-amber-500/15",
    type: "Yorum",
  },
  {
    trigger: "Sipariş CONFIRMED · ORD-202605-00448",
    triggerIcon: Receipt,
    action: "AI e-fatura kesti + GİB'e gönderdi",
    meta: "INVOICE_ISSUE · 12sn · UUID alındı",
    iconCls: "text-emerald-300 bg-emerald-500/15",
    type: "E-fatura",
  },
  {
    trigger: "Havale ingest · ₺2.116,92 · Garanti BBVA",
    triggerIcon: Banknote,
    action: "AI sipariş referansı eşledi",
    meta: "BANK_MATCH · güven %97 · 3sn",
    iconCls: "text-fuchsia-300 bg-fuchsia-500/15",
    type: "Havale",
  },
  {
    trigger: "Stok eşik altı · PT-ESOFMAN-ALTI-GRI · 3 adet",
    triggerIcon: Package,
    action: "AI tedarikçi maili yazdı + gönderdi",
    meta: "STOCK_REORDER · 50 adet · 8sn",
    iconCls: "text-indigo-300 bg-indigo-500/15",
    type: "Stok",
  },
  {
    trigger: "Yeni müşteri segmentasyon taraması",
    triggerIcon: Users,
    action: "AI 'VIP' etiketledi · 13 sipariş / 7 gün",
    meta: "SEGMENT · güven %95 · 5sn",
    iconCls: "text-cyan-300 bg-cyan-500/15",
    type: "Segment",
  },
  {
    trigger: "Yavaş ürün tespit · 92 gün satışsız",
    triggerIcon: Tag,
    action: "AI fiyat indirimi önerdi (-%20)",
    meta: "PRICE_SUGGEST · ₺249,90 → ₺199,00",
    iconCls: "text-rose-300 bg-rose-500/15",
    type: "Fiyat",
  },
  {
    trigger: "Saatlik metrik tarama · iade oranı sıçradı",
    triggerIcon: AlertTriangle,
    action: "AI anomali açıkladı + aksiyon önerdi",
    meta: "ANOMALY · %5 → %14 · bahar koleksiyonu",
    iconCls: "text-orange-300 bg-orange-500/15",
    type: "Anomali",
  },
];

const TONE: Record<string, { bg: string; ring: string; iconBg: string; text: string }> = {
  fuchsia: { bg: "bg-fuchsia-500/[0.07]", ring: "ring-fuchsia-500/20", iconBg: "bg-fuchsia-500/15 text-fuchsia-300", text: "text-fuchsia-300" },
  emerald: { bg: "bg-emerald-500/[0.07]", ring: "ring-emerald-500/20", iconBg: "bg-emerald-500/15 text-emerald-300", text: "text-emerald-300" },
  amber: { bg: "bg-amber-500/[0.07]", ring: "ring-amber-500/20", iconBg: "bg-amber-500/15 text-amber-300", text: "text-amber-300" },
  muted: { bg: "bg-white/[0.025]", ring: "ring-white/10", iconBg: "bg-white/[0.06] text-white/60", text: "text-white/55" },
};

export function SceneOtopilot() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [statsCounter, setStatsCounter] = useState({ thisWeek: 41, executed: 33 });

  useEffect(() => {
    let cancelled = false;
    setFeed([]);
    setStatsCounter({ thisWeek: 41, executed: 33 });
    async function play() {
      // 600ms ilk gecikme, sonra her ~1.35sn'de bir trigger
      await new Promise((r) => setTimeout(r, 600));
      for (const t of TRIGGERS) {
        if (cancelled) return;
        setFeed((prev) => [t, ...prev]);
        setStatsCounter((prev) => ({
          thisWeek: prev.thisWeek + 1,
          executed: prev.executed + 1,
        }));
        await new Promise((r) => setTimeout(r, 1350));
      }
    }
    play();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex flex-col gap-2.5 overflow-hidden p-4 text-left"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start gap-2"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-md shadow-fuchsia-500/30">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-[13px] font-semibold tracking-tight text-white">
              Otopilot
            </h1>
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="rounded-full bg-fuchsia-500/20 px-1.5 py-0.5 text-[7.5px] font-bold uppercase tracking-wider text-fuchsia-300"
            >
              AKTİF
            </motion.span>
          </div>
          <p className="text-[9px] leading-tight text-white/55">
            AI 7 paralel işi otomatik yapıyor — yorumlar, faturalar, havaleler…
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "Bu hafta", value: statsCounter.thisWeek, icon: Sparkles, tone: "fuchsia" },
          { label: "Yapıldı", value: statsCounter.executed, icon: CheckCircle2, tone: "emerald" },
          { label: "Bekleyen", value: 4, icon: Clock, tone: "amber" },
          { label: "Atlandı", value: 2, icon: XCircle, tone: "muted" },
        ].map((s, i) => {
          const c = TONE[s.tone];
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 + i * 0.05 }}
              className={`rounded-md border border-white/10 ${c.bg} px-1.5 py-1 ring-1 ${c.ring}`}
            >
              <div className="flex items-center justify-between">
                <span className={`truncate text-[8.5px] font-medium uppercase tracking-wider ${c.text}`}>
                  {s.label}
                </span>
                <span className={`grid h-3 w-3 shrink-0 place-items-center rounded ${c.iconBg}`}>
                  <Icon className="h-1.5 w-1.5" />
                </span>
              </div>
              <div className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums leading-none text-white">
                <AnimatedNumber value={s.value} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 7 kabiliyet chip rozetleri (statik referans) */}
      <div className="flex flex-wrap gap-1">
        {["Yorum", "E-fatura", "Havale", "Stok", "Segment", "Fiyat", "Anomali"].map((c, i) => (
          <motion.span
            key={c}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.2 + i * 0.04 }}
            className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[8px] text-white/65"
          >
            {c}
          </motion.span>
        ))}
      </div>

      {/* Feed */}
      <div className="flex-1 space-y-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.015] p-1.5">
        <div className="mb-0.5 flex items-center gap-1 px-1 text-[8.5px] font-medium uppercase tracking-wider text-white/40">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-400" />
          Otopilot canlı feed
          <span className="ml-auto font-mono text-white/30">{feed.length}/7</span>
        </div>
        <AnimatePresence initial={false}>
          {feed.map((item, i) => {
            const Icon = item.triggerIcon;
            return (
              <motion.div
                key={item.trigger}
                initial={{ opacity: 0, height: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`overflow-hidden rounded-md border px-2 py-1 ${
                  i === 0
                    ? "border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/[0.08] to-transparent"
                    : "border-white/[0.06] bg-white/[0.025]"
                }`}
              >
                <div className="flex items-start gap-1.5">
                  <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded ${item.iconCls}`}>
                    <Icon className="h-2 w-2" />
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-[9.5px] text-white/55">
                      <span className="font-semibold text-white/70">olay:</span> {item.trigger}
                    </div>
                    <div className="truncate text-[10px] font-medium text-white/95">
                      <span className="font-semibold text-fuchsia-300">→ AI:</span>{" "}
                      {item.action}
                    </div>
                    <div className="truncate font-mono text-[7.5px] text-white/35">
                      {item.meta}
                    </div>
                  </div>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1 py-0.5 text-[7.5px] font-bold text-emerald-300"
                  >
                    ✓
                  </motion.span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Sağ alt: Otopilot canlı FAB */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, type: "spring", stiffness: 200, damping: 16 }}
        className="absolute bottom-3 right-3 z-10"
      >
        <div className="flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 px-2 py-1 shadow-lg shadow-fuchsia-500/30 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gradient-to-br from-fuchsia-400 to-indigo-400" />
          </span>
          <span className="text-[9px] font-semibold text-white/95">Otopilot canlı</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
