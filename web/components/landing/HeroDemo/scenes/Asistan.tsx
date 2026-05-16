"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  LineChart,
  PieChart,
  User,
  Loader2,
  CheckCircle2,
  Send,
} from "lucide-react";
import { CommerceOSLogo } from "@/components/brand/logo";

/**
 * AI Asistan — gerçek ChatPanel görünümü + input typewriter + send tıklama
 * akışı. Her soru için:
 *  1. Textarea'ya typewriter ile yazılır
 *  2. Send butonu vurgu pulse'u
 *  3. User bubble chat'e eklenir, textarea temizlenir
 *  4. AI loading → chart → answer
 *  5. Bir sonraki soruya geç
 */

type ChartType = "bar" | "donut" | "line";

type ChatStep = {
  q: string;
  chart: {
    type: ChartType;
    title: string;
    labels: string[];
    values: number[];
    unit?: string;
  };
  summary: string;
};

const STEPS: ChatStep[] = [
  {
    q: "Bu hafta en çok satan 3 ürünü ciroyla beraber söyler misin?",
    chart: {
      type: "bar",
      title: "Top 3 ürün · son 7 günlük ciro",
      labels: ["Pamuk Tişört", "Eşofman Gri", "Sweatshirt"],
      values: [11703, 18962, 14490],
      unit: "₺",
    },
    summary:
      "Bu hafta en çok satanlar — toplam ciro **₺45.155** (geçen haftadan **%18 yüksek**).",
  },
  {
    q: "Sipariş durumlarının dağılımı nasıl?",
    chart: {
      type: "donut",
      title: "310 sipariş · status dağılımı",
      labels: ["DELIVERED", "SHIPPED", "PENDING", "CONFIRMED", "REFUNDED"],
      values: [125, 64, 54, 38, 17],
    },
    summary:
      "DELIVERED **%40**, aktif (PENDING + CONFIRMED) **%30**. İade oranı **%5,5** normal aralıkta.",
  },
  {
    q: "Son 5 ayın ciro trendi nasıl?",
    chart: {
      type: "line",
      title: "Aylık ciro · son 5 ay (₺ bin)",
      labels: ["Oca", "Şub", "Mar", "Nis", "May"],
      values: [124, 156, 178, 215, 195],
      unit: "₺K",
    },
    summary:
      "Ciro **+162%** büyüdü (Aralık → Nisan). Mayıs **₺195K** / 13 gün — beklenen **₺240K**.",
  },
];

type ConvTurn = { step: ChatStep; stage: number }; // 0=user, 1=loading, 2=chart, 3=answer

export function SceneAsistan() {
  const [conv, setConv] = useState<ConvTurn[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Race-safe: her mount kendi id'sini taşır; zombie state update'leri reddedilir.
    // React StrictMode dev'de useEffect'i çift tetikleyebilir; ya da AnimatePresence
    // unmount'tan sonra timer hala beklerken state çağrılır — bu kontrol ikisini de çözer.
    let cancelled = false;
    const safe = <T,>(fn: () => T): T | undefined => (cancelled ? undefined : fn());

    setConv([]);
    setInputText("");
    setSending(false);

    async function typeText(text: string, msPerChar = 28) {
      safe(() => setInputText(""));
      for (let i = 1; i <= text.length; i++) {
        await new Promise((r) => setTimeout(r, msPerChar));
        if (cancelled) return;
        safe(() => setInputText(text.slice(0, i)));
      }
    }

    async function wait(ms: number) {
      await new Promise((r) => setTimeout(r, ms));
    }

    async function play() {
      await wait(400);
      if (cancelled) return;
      for (let idx = 0; idx < STEPS.length; idx++) {
        const step = STEPS[idx];
        // 1. Typewriter
        await typeText(step.q, 25);
        if (cancelled) return;
        await wait(350);
        if (cancelled) return;
        // 2. Send pulse
        safe(() => setSending(true));
        await wait(280);
        if (cancelled) return;
        // 3. Bubble + temizle
        safe(() => setConv((prev) => [...prev, { step, stage: 0 }]));
        safe(() => setInputText(""));
        safe(() => setSending(false));
        await wait(450);
        if (cancelled) return;
        // 4. Loading
        safe(() => setConv((prev) => prev.map((t, i) => (i === idx ? { ...t, stage: 1 } : t))));
        await wait(700);
        if (cancelled) return;
        // 5. Chart
        safe(() => setConv((prev) => prev.map((t, i) => (i === idx ? { ...t, stage: 2 } : t))));
        await wait(900);
        if (cancelled) return;
        // 6. Answer
        safe(() => setConv((prev) => prev.map((t, i) => (i === idx ? { ...t, stage: 3 } : t))));
        await wait(1200);
      }
    }

    play();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [conv]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex flex-col text-left"
    >
      {/* Chat header */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-white/10 bg-black/60">
          <CommerceOSLogo size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10.5px] font-semibold text-white/95">AI Asistan</div>
          <div className="text-[8.5px] text-white/45">
            Türkçe sor, grafik döner — read-only PostgreSQL
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-300">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          bağlı
        </span>
      </div>

      {/* Chat scroll alanı */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
        style={{ scrollbarWidth: "none" }}
      >
        <AnimatePresence initial={false}>
          {conv.map((t, i) => (
            <ChatTurn key={i} step={t.step} stage={t.stage} />
          ))}
        </AnimatePresence>
      </div>

      {/* Input bar — gerçek ChatPanel'in alt textarea + send buttonu */}
      <div className="border-t border-white/[0.06] bg-white/[0.015] px-3 py-2">
        <div className="flex items-end gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
          <div className="min-w-0 flex-1 text-left text-[10.5px] leading-snug text-white/90">
            {inputText ? (
              <>
                {inputText}
                <span className="ml-0.5 inline-block h-2.5 w-0.5 animate-pulse bg-fuchsia-300 align-middle" />
              </>
            ) : (
              <span className="text-white/30">Veritabanına Türkçe sor…</span>
            )}
          </div>
          <motion.button
            animate={sending ? { scale: [1, 0.85, 1] } : { scale: 1 }}
            transition={{ duration: 0.28 }}
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-md transition-colors ${
              inputText
                ? "bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow shadow-fuchsia-500/30"
                : "bg-white/[0.06] text-white/30"
            }`}
          >
            <Send className="h-2.5 w-2.5" />
          </motion.button>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[8px] text-white/35">
          <span>↵ Gönder · Shift+↵ satır atla</span>
          <span className="ml-auto">Gemini 2.5 Pro</span>
        </div>
      </div>
    </motion.div>
  );
}

function ChatTurn({ step, stage }: { step: ChatStep; stage: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-1.5"
    >
      {/* User mesajı */}
      <div className="flex flex-row-reverse gap-2">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/[0.08]">
          <User className="h-3 w-3 text-white/80" />
        </div>
        <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-white/[0.07] px-2.5 py-1.5 text-left text-[10.5px] leading-snug text-white/95">
          {step.q}
        </div>
      </div>

      {/* AI cevap */}
      {stage >= 1 && (
        <div className="flex gap-2">
          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-fuchsia-400/30 bg-black/60 ring-1 ring-fuchsia-500/20">
            <CommerceOSLogo size={14} />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <motion.div
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[8.5px] transition-colors ${
                stage >= 2
                  ? "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-300"
                  : "border-white/10 bg-white/[0.03] text-white/55"
              }`}
            >
              {stage >= 2 ? (
                <>
                  <CheckCircle2 className="h-2 w-2" />
                  Veritabanına sorgu atıldı · 3 satır
                </>
              ) : (
                <>
                  <Loader2 className="h-2 w-2 animate-spin" />
                  Veritabanına sorgu atılıyor
                </>
              )}
            </motion.div>

            {stage >= 2 && <ChartBlock chart={step.chart} />}

            {stage >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg bg-white/[0.025] px-2.5 py-1.5 text-left text-[10.5px] leading-snug text-white/85"
                dangerouslySetInnerHTML={{ __html: renderMd(step.summary) }}
              />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function renderMd(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>');
}

function ChartBlock({ chart }: { chart: ChatStep["chart"] }) {
  const Icon =
    chart.type === "line" ? LineChart : chart.type === "donut" ? PieChart : BarChart3;
  const max = Math.max(...chart.values, 1);
  const total = chart.values.reduce((a, b) => a + b, 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01]"
    >
      <div className="flex items-baseline justify-between border-b border-white/[0.05] px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <Icon
            className={`h-3 w-3 ${
              chart.type === "line"
                ? "text-fuchsia-300"
                : chart.type === "donut"
                ? "text-amber-300"
                : "text-indigo-300"
            }`}
          />
          <h4 className="text-[10px] font-semibold text-white/90">{chart.title}</h4>
        </div>
        <span className="rounded-full border border-white/10 bg-black/40 px-1.5 py-0.5 text-[7.5px] text-white/45">
          {chart.values.length} nokta
          {chart.unit && (
            <span className="ml-1 font-mono uppercase tracking-wider">{chart.unit}</span>
          )}
        </span>
      </div>
      <div className="p-2">
        {chart.type === "bar" && (
          <div className="space-y-1.5">
            {chart.labels.map((label, i) => {
              const pct = (chart.values[i] / max) * 100;
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-16 truncate text-[9px] text-white/65">{label}</span>
                  <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-[9px] tabular-nums text-white/85">
                    ₺{chart.values[i].toLocaleString("tr-TR")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {chart.type === "line" && (
          <LineChartViz values={chart.values} labels={chart.labels} />
        )}
        {chart.type === "donut" && (
          <div className="flex items-center gap-3">
            <DonutViz values={chart.values} />
            <div className="flex-1 space-y-0.5">
              {chart.labels.map((label, i) => {
                const pct = ((chart.values[i] / total) * 100).toFixed(0);
                return (
                  <div key={label} className="flex items-center gap-1.5 text-[9px]">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                    />
                    <span className="flex-1 truncate text-white/65">{label}</span>
                    <span className="font-mono tabular-nums text-white/85">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LineChartViz({ values, labels }: { values: number[]; labels: string[] }) {
  const w = 220;
  const h = 64;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (w - 12) + 6;
    const y = h - 10 - ((v - min) / range) * (h - 18);
    return [x, y] as const;
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0]},${h - 10} L${pts[0][0]},${h - 10} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="block h-14 w-full">
        <defs>
          <linearGradient id="lg1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(217 70 239)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="rgb(217 70 239)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill="url(#lg1)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        <motion.path
          d={path}
          stroke="rgb(217 70 239)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        {pts.map((p, i) => (
          <motion.circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r="2.2"
            fill="rgb(217 70 239)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 + i * 0.06 }}
          />
        ))}
      </svg>
      <div className="mt-0.5 flex justify-between px-1 text-[7.5px] text-white/40">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

const DONUT_COLORS = [
  "rgb(16 185 129)",
  "rgb(59 130 246)",
  "rgb(245 158 11)",
  "rgb(139 92 246)",
  "rgb(239 68 68)",
];

function DonutViz({ values }: { values: number[] }) {
  const r = 24;
  const cx = 28;
  const cy = 28;
  const total = values.reduce((a, b) => a + b, 0);
  let offset = 0;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
      {values.map((v, i) => {
        const pct = v / total;
        const startAngle = (offset / total) * 2 * Math.PI - Math.PI / 2;
        const endAngle = ((offset + v) / total) * 2 * Math.PI - Math.PI / 2;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = pct > 0.5 ? 1 : 0;
        const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
        offset += v;
        return (
          <motion.path
            key={i}
            d={d}
            fill={DONUT_COLORS[i % DONUT_COLORS.length]}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#09090b" />
    </svg>
  );
}
