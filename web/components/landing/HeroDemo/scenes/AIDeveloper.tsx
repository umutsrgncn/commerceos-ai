"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Clock,
  Sparkles,
  Brain,
  ArrowRight,
  Loader2,
  Globe,
  X,
  Check,
  GitCommit,
  FileEdit,
  TestTube2,
  ShieldCheck,
} from "lucide-react";

/**
 * AI Geliştirici sahnesi — tam end-to-end akış.
 *
 * Aşamalar (state machine):
 *  1. list      — header + form (typewriter) + son task'lar
 *  2. submitting — "Görevi başlat" tıklandı, yeni task üstte
 *  3. detail    — task detay sayfası: event timeline aşama aşama
 *  4. preview   — Cloudflare önizleme tüneli, mockup screenshot zoom
 *  5. merged    — "Kabul et" + canlıya alındı animasyonu
 */

type Stage = "list" | "submitting" | "detail" | "preview" | "merged";

const TITLE = "Beden tablosu modal'ı";
const DETAIL = "Ürün detayında beden seçimi modal'ı aç";

function useTypewriter(text: string, msPerChar: number, startAfter: number) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    const startT = setTimeout(() => {
      let i = 0;
      const it = setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(it);
      }, msPerChar);
    }, startAfter);
    return () => clearTimeout(startT);
  }, [text, msPerChar, startAfter]);
  return out;
}

export function SceneAIDeveloper() {
  const [stage, setStage] = useState<Stage>("list");

  // Akış: list (3.5sn) → submitting (1sn) → detail (5sn) → preview (4sn) → merged (1sn)
  // Toplam: 14.5sn (SCENE_DWELL ile uyumlu)
  useEffect(() => {
    let cancelled = false;
    const set = (s: Stage) => {
      if (!cancelled) setStage(s);
    };
    const t1 = setTimeout(() => set("submitting"), 3500);
    const t2 = setTimeout(() => set("detail"), 4500);
    const t3 = setTimeout(() => set("preview"), 9500);
    const t4 = setTimeout(() => set("merged"), 13500);
    return () => {
      cancelled = true;
      [t1, t2, t3, t4].forEach(clearTimeout);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {(stage === "list" || stage === "submitting") && (
          <ListView key="list" stage={stage} />
        )}
        {stage === "detail" && <DetailView key="detail" />}
        {stage === "preview" && <PreviewView key="preview" />}
        {stage === "merged" && <MergedView key="merged" />}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── List view (header + form + task listesi) ───────────────────────────────

function ListView({ stage }: { stage: Stage }) {
  const title = useTypewriter(TITLE, 50, 400);
  const detail = useTypewriter(DETAIL, 25, 400 + TITLE.length * 50 + 300);
  const submitted = stage === "submitting";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
      className="flex h-full flex-col gap-2.5 p-4 text-left"
    >
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-fuchsia-500/[0.10] via-indigo-500/[0.05] to-emerald-500/[0.08] px-3 py-2">
        <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-fuchsia-500/15 blur-2xl" />
        <div className="relative flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-fuchsia-500/15 text-fuchsia-300">
            <Bot className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-1.5 py-0.5 text-[7.5px] font-semibold uppercase tracking-[0.18em] text-white/55">
              <span className="h-1 w-1 rounded-full bg-fuchsia-500" />
              Gemini 2.5 Pro · Autonomous
            </div>
            <h1 className="mt-0.5 text-[13px] font-semibold leading-tight text-white">
              AI Geliştirici
            </h1>
            <p className="text-[9px] leading-tight text-white/55">
              Doğal dilde anlat, agent yapar.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-fuchsia-500/[0.04] to-transparent p-2.5">
        <div className="flex items-center gap-1.5">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-fuchsia-500/15 text-fuchsia-300">
            <Sparkles className="h-2.5 w-2.5" />
          </span>
          <span className="text-[10px] font-semibold text-white/90">
            Yeni geliştirme görevi
          </span>
        </div>

        <div className="mt-2 space-y-1.5">
          <div>
            <div className="mb-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/40">
              Başlık
            </div>
            <div className="rounded border border-white/10 bg-black/50 px-2 py-1 text-left text-[10.5px] font-medium text-white/95">
              {title}
              {title.length < TITLE.length && (
                <span className="ml-0.5 inline-block h-2.5 w-0.5 animate-pulse bg-fuchsia-300 align-middle" />
              )}
              {title.length >= TITLE.length && (
                <span className="text-white/30">&nbsp;</span>
              )}
            </div>
          </div>
          <div>
            <div className="mb-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/40">
              Detaylar
            </div>
            <div className="min-h-[28px] rounded border border-white/10 bg-black/50 px-2 py-1 text-left font-mono text-[9.5px] leading-relaxed text-white/80">
              {detail}
              {detail && detail.length < DETAIL.length && (
                <span className="ml-0.5 inline-block h-2 w-0.5 animate-pulse bg-fuchsia-300 align-middle" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-1.5 flex items-start gap-1 rounded border border-indigo-500/20 bg-indigo-500/[0.05] px-1.5 py-1">
          <Brain className="mt-0.5 h-2 w-2 shrink-0 text-indigo-300" />
          <div className="text-left text-[8.5px] leading-tight text-white/65">
            <strong className="text-white/85">AI önce keşif yapar:</strong> ilgili sayfaları kendi seçer.
          </div>
        </div>

        <div className="mt-2 flex items-center justify-end">
          <motion.div
            animate={submitted ? { scale: [1, 0.92, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors ${
              submitted
                ? "bg-fuchsia-500/30 text-fuchsia-200"
                : "bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-md shadow-fuchsia-500/30"
            }`}
          >
            {submitted ? (
              <>
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                Planlanıyor…
              </>
            ) : (
              <>
                Görevi başlat
                <ArrowRight className="h-2.5 w-2.5" />
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Son task'lar */}
      <div className="flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.015]">
        <div className="flex items-center gap-1 border-b border-white/[0.06] bg-white/[0.02] px-2 py-1">
          <Sparkles className="h-2 w-2 text-fuchsia-300" />
          <span className="text-[9px] font-semibold text-white/85">Son task'lar</span>
        </div>
        <div className="divide-y divide-white/[0.05]">
          <AnimatePresence initial={false}>
            {submitted && (
              <motion.div
                key="new"
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-500/[0.10] to-transparent px-2 py-1.5"
              >
                <span className="shrink-0 rounded-full border border-blue-500/25 bg-blue-500/15 px-1.5 py-0.5 text-[7.5px] font-bold text-blue-300">
                  Çalışıyor
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate text-[10px] font-medium text-white/90">
                    {TITLE}
                  </div>
                  <div className="truncate font-mono text-[7.5px] text-white/40">
                    az önce · planlanıyor…
                  </div>
                </div>
                <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-300" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-1.5 px-2 py-1.5">
            <span className="shrink-0 rounded-full border border-amber-500/25 bg-amber-500/15 px-1.5 py-0.5 text-[7.5px] font-bold text-amber-300">
              Onayda
            </span>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[10px] font-medium text-white/85">
                müşteri detayında WhatsApp butonu
              </div>
              <div className="truncate font-mono text-[7.5px] text-white/40">
                ⎇ admin-customers-whatsapp-7m · 5 dk
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5">
            <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/15 px-1.5 py-0.5 text-[7.5px] font-bold text-emerald-300">
              Yayında
            </span>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[10px] font-medium text-white/85">
                Footer'a KVKK linki ekle
              </div>
              <div className="truncate font-mono text-[7.5px] text-white/40">
                ⎇ shop-footer-kvkk-2j · 1 saat
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Detail view (event timeline) ───────────────────────────────────────────

type EventRow = {
  time: string;
  type: "think" | "tool" | "write" | "ok" | "test";
  text: string;
  icon: typeof Brain;
};

const EVENTS: EventRow[] = [
  { time: "14:18:12", type: "think", text: "Plan: 4 adım, scope: shop_product", icon: Brain },
  { time: "14:18:18", type: "tool", text: "read_file: product/[slug]/page.tsx", icon: FileEdit },
  { time: "14:18:42", type: "write", text: "_components/size-modal.tsx oluşturuldu", icon: FileEdit },
  { time: "14:19:21", type: "ok", text: "TypeScript: 0 hata", icon: CheckCircle2 },
  { time: "14:19:48", type: "test", text: "Playwright: 9/9 spec geçti", icon: TestTube2 },
  { time: "14:19:55", type: "ok", text: "Cloudflare tunnel → onayına sunuldu", icon: Globe },
];

const TYPE_CLS: Record<EventRow["type"], string> = {
  think: "text-indigo-300 bg-indigo-500/15",
  tool: "text-cyan-300 bg-cyan-500/15",
  write: "text-fuchsia-300 bg-fuchsia-500/15",
  ok: "text-emerald-300 bg-emerald-500/15",
  test: "text-amber-300 bg-amber-500/15",
};

function DetailView() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="flex h-full flex-col gap-2 p-4 text-left"
    >
      {/* Detail header */}
      <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] pb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 rounded-full border border-blue-500/25 bg-blue-500/15 px-1.5 py-0.5 text-[7.5px] font-bold text-blue-300">
              Çalışıyor
            </span>
            <span className="font-mono text-[8.5px] text-white/45">
              ⎇ shop-product-size-modal
            </span>
          </div>
          <h2 className="mt-1 text-[12px] font-semibold leading-tight text-white">
            {TITLE}
          </h2>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/[0.08] px-1.5 py-1 text-[8.5px] font-semibold text-amber-300">
          <Loader2 className="h-2 w-2 animate-spin" />
          1/15 iter
        </div>
      </div>

      {/* Event timeline */}
      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="mb-0.5 flex items-center gap-1 text-[8.5px] font-medium uppercase tracking-wider text-white/40">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Canlı event akışı
        </div>
        {EVENTS.map((e, i) => {
          const Icon = e.icon;
          return (
            <motion.div
              key={e.time}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.45 }}
              className="flex items-start gap-1.5 rounded border border-white/[0.05] bg-white/[0.02] px-1.5 py-1"
            >
              <span className="mt-0.5 font-mono text-[8px] text-white/30">{e.time}</span>
              <span className={`shrink-0 rounded px-1 py-0.5 text-[7.5px] font-bold ${TYPE_CLS[e.type]}`}>
                {e.type}
              </span>
              <Icon className="mt-0.5 h-2 w-2 shrink-0 text-white/40" />
              <span className="flex-1 text-[9.5px] leading-tight text-white/80">{e.text}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Preview view (Cloudflare tunnel, mockup zoom) ──────────────────────────

function PreviewView() {
  const [zoomed, setZoomed] = useState(false);
  const [ringPos, setRingPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const mockupRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // 1.6sn sonra preview mockup'a zoom (kullanıcı önizleme linkine tıkladı izlenimi)
    const t = setTimeout(() => {
      setZoomed(true);
      // Ring pozisyonunu gerçek button'a göre hesapla
      requestAnimationFrame(() => {
        const m = mockupRef.current;
        const b = targetRef.current;
        if (!m || !b) return;
        const mr = m.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        setRingPos({
          x: br.left - mr.left - 6,
          y: br.top - mr.top - 4,
          w: br.width + 12,
          h: br.height + 8,
        });
      });
    }, 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex h-full flex-col gap-2 p-4 text-left"
    >
      {/* Header: REVIEW status + decision buttons */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 rounded-full border border-amber-500/25 bg-amber-500/15 px-1.5 py-0.5 text-[7.5px] font-bold text-amber-300">
            Onayda
          </span>
          <h2 className="text-[11px] font-semibold leading-tight text-white">
            {TITLE}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/[0.05] px-1.5 py-0.5 text-[8.5px] font-semibold text-rose-300"
          >
            <X className="h-2 w-2" />
            Reddet
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: zoomed ? [1, 1.12, 1] : 1 }}
            transition={{
              delay: 0.4,
              scale: zoomed ? { duration: 0.6, delay: 1.5 } : { duration: 0.3 },
            }}
            className="inline-flex items-center gap-1 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 px-1.5 py-0.5 text-[8.5px] font-semibold text-white shadow-md shadow-emerald-500/30"
          >
            <Check className="h-2 w-2" />
            Kabul et
          </motion.div>
        </div>
      </div>

      {/* Tunnel hazır bandı — büyük, dikkat çekici */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-500/[0.08] via-cyan-500/[0.04] to-transparent px-2.5 py-1.5"
      >
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-500/20">
          <Globe className="h-2.5 w-2.5 text-cyan-300" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[9.5px] font-semibold text-white/90">
            ☁️ Cloudflare tunnel hazır — önizleme açık
          </div>
          <div className="truncate font-mono text-[8.5px] text-cyan-200/85">
            houses-magnificent-geek.trycloudflare.com
          </div>
        </div>
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0.5 text-[8px] font-bold text-cyan-200"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
          canlı
        </motion.span>
      </motion.div>

      {/* Mockup preview — zoom transition */}
      <motion.div
        ref={mockupRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={zoomed ? { opacity: 1, scale: 1.02 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01]"
      >
        {/* Browser chrome mini */}
        <div className="flex items-center gap-1 border-b border-white/[0.06] bg-white/[0.02] px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
          <span className="ml-1.5 font-mono text-[7.5px] text-cyan-200/80">
            houses-magnificent-geek.trycloudflare.com/shop/p/pamuk-tisort
          </span>
        </div>
        {/* Gerçekçi ürün detayı */}
        <div className="grid h-full grid-cols-[55%_1fr] gap-2 bg-[#0c0c0e] p-2">
          {/* Sol — ürün foto placeholder */}
          <div className="relative overflow-hidden rounded bg-gradient-to-br from-stone-600/40 via-stone-700/50 to-stone-900/70">
            <div className="absolute inset-x-2 bottom-2 grid grid-cols-4 gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-sm bg-white/10 ring-1 ring-white/20"
                  style={{
                    background: `linear-gradient(135deg, hsl(${30 + i * 20},20%,30%), hsl(${30 + i * 20},25%,50%))`,
                  }}
                />
              ))}
            </div>
          </div>
          {/* Sağ — ürün bilgi + beden seçim + AI badge */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[9px] uppercase tracking-wider text-white/40">Pamuk</div>
            <div className="text-[12px] font-semibold leading-tight text-white">
              Pamuk Basic Tişört
            </div>
            <div className="text-[10px] font-mono text-white/55">SKU PT-TISORT-001</div>
            <div className="mt-1.5 text-[14px] font-bold text-fuchsia-300">₺249,90</div>

            <div className="mt-1.5 text-[8.5px] font-semibold uppercase tracking-wider text-white/55">
              Beden
            </div>
            <div className="flex gap-1">
              {["XS", "S", "M", "L", "XL"].map((s) => (
                <span
                  key={s}
                  className={`grid h-5 w-5 place-items-center rounded-md border text-[8.5px] font-semibold ${
                    s === "M"
                      ? "border-fuchsia-400 bg-fuchsia-500/20 text-white"
                      : "border-white/15 text-white/70"
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>

            {/* YENİ: Beden tablosu link — ring target */}
            <motion.button
              ref={targetRef}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-0.5 inline-flex items-center gap-1 rounded-md border border-fuchsia-500/40 bg-fuchsia-500/15 px-1.5 py-0.5 text-[8px] font-semibold text-fuchsia-200"
            >
              <Sparkles className="h-1.5 w-1.5" />
              Beden tablosu
            </motion.button>

            <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-1">
              <div className="flex items-center justify-center rounded-md bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-1 text-[8.5px] font-semibold text-white">
                Sepete ekle
              </div>
              <div className="grid h-6 w-6 place-items-center rounded-md border border-white/15">
                <span className="text-[10px] text-white/70">♡</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zoom-in ring — gerçek beden tablosu button'unun üstüne hizalı */}
        {zoomed && ringPos && (
          <motion.div
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: [0, 1, 1, 0.5], scale: [1.5, 1, 1, 1.05] }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="pointer-events-none absolute rounded-md border-2 border-fuchsia-400 shadow-[0_0_28px_rgba(217,70,239,0.6)]"
            style={{
              left: ringPos.x,
              top: ringPos.y,
              width: ringPos.w,
              height: ringPos.h,
            }}
          />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-[8.5px] text-white/45"
      >
        💡 Önizlemede beden tablosu butonunu test et, beğenirsen onayla.
      </motion.div>
    </motion.div>
  );
}

// ─── Merged view (kabul edildi, canlıya alındı) ────────────────────────────

function MergedView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="relative flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
    >
      {/* Confetti-vari noktalar */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{
              opacity: 0,
              x: 0,
              y: 0,
              scale: 0,
            }}
            animate={{
              opacity: [0, 1, 0],
              x: (Math.random() - 0.5) * 280,
              y: -100 - Math.random() * 80,
              scale: [0, 1, 0.7],
              rotate: Math.random() * 360,
            }}
            transition={{ duration: 1.6, delay: 0.1 + i * 0.03, ease: "easeOut" }}
            className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 ${
              ["bg-fuchsia-400", "bg-indigo-400", "bg-emerald-400", "bg-amber-400", "bg-cyan-400"][i % 5]
            }`}
            style={{ borderRadius: i % 2 ? "50%" : "1px" }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/40"
      >
        <Check className="h-7 w-7 text-white" strokeWidth={3} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-2 py-0.5 text-[8.5px] font-semibold text-emerald-300">
          <GitCommit className="h-2 w-2" />
          main · merged
        </div>
        <h2 className="mt-1.5 text-base font-semibold text-white">Canlıya alındı 🎉</h2>
        <p className="mt-0.5 text-[10px] text-white/55">
          {TITLE} — agent + e2e + tunnel + onay = ~6dk
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 font-mono text-[8.5px] text-white/55"
      >
        <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" />
        prisma · auth · middleware <span className="text-emerald-300">korumalı kaldı</span>
      </motion.div>
    </motion.div>
  );
}
