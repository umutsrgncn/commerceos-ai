"use client";

/**
 * Landing page'in flagship "AI Geliştirici" bölümü.
 *
 * - Hero başlığı + gradient badge
 * - 4 aşamalı pipeline kartları (Plan → Yaz → Doğrula → Yayınla)
 * - Sahte canlı agent timeline (CSS animation, JS state'siz)
 * - 4 gerçek MERGED görev örneği (kart grid)
 * - Alt-stat şeridi: scope sayısı, e2e spec, tsc gate vb.
 *
 * Tüm görseller CSS/SVG ile — dış resim yok.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  FileCode,
  GitCommit,
  Hammer,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

// ───────────── Pipeline stages ─────────────

export const STAGES = [
  {
    label: "Plan",
    icon: Brain,
    model: "Gemini 2.5 Pro",
    desc: "Görevi tritaj eder, scope seçer, adımları çıkarır. Anlamsız ya da güvenlik riskli ise burada reddeder.",
    accent: "indigo",
  },
  {
    label: "Yaz",
    icon: FileCode,
    model: "Gemini 2.5 Flash",
    desc: "Function-calling tool-use döngüsü: list_dir, read_file, edit_file, write_file. Komponent kataloğunu önden bilir, halüsinasyon yapmaz.",
    accent: "fuchsia",
  },
  {
    label: "Doğrula",
    icon: ShieldCheck,
    model: "tsc + RSC lint + e2e",
    desc: "TypeScript hatasız mı? Server/client karışmamış mı? Playwright spec'leri geçiyor mu? Yeşilden bir tanesi bile değilse finish reddedilir.",
    accent: "emerald",
  },
  {
    label: "Yayınla",
    icon: GitCommit,
    model: "Cloudflared tunnel",
    desc: "Isolated branch'te commit + önizleme tüneli. Sen onayla → main'e merge. Reddet → dosyalar atılır.",
    accent: "amber",
  },
] as const;

const ACCENT_STYLE = {
  indigo: {
    text: "text-indigo-300",
    bg: "bg-indigo-500/12",
    border: "border-indigo-500/25",
    ring: "ring-indigo-500/30",
    glow: "from-indigo-500/30",
    chip: "bg-indigo-500/15 text-indigo-300",
  },
  fuchsia: {
    text: "text-fuchsia-300",
    bg: "bg-fuchsia-500/12",
    border: "border-fuchsia-500/25",
    ring: "ring-fuchsia-500/30",
    glow: "from-fuchsia-500/30",
    chip: "bg-fuchsia-500/15 text-fuchsia-300",
  },
  emerald: {
    text: "text-emerald-300",
    bg: "bg-emerald-500/12",
    border: "border-emerald-500/25",
    ring: "ring-emerald-500/30",
    glow: "from-emerald-500/30",
    chip: "bg-emerald-500/15 text-emerald-300",
  },
  amber: {
    text: "text-amber-300",
    bg: "bg-amber-500/12",
    border: "border-amber-500/25",
    ring: "ring-amber-500/30",
    glow: "from-amber-500/30",
    chip: "bg-amber-500/15 text-amber-300",
  },
} as const;

// ───────────── Live timeline mock data ─────────────

type Step = { time: string; kind: "think" | "tool" | "write" | "test" | "ok"; text: string };

const TIMELINE: Step[] = [
  { time: "14:18:12", kind: "think", text: "Plan: 4 adım, scope: shop_product · feasible" },
  { time: "14:18:18", kind: "tool", text: "read_file: web/components/ui/modal.tsx" },
  { time: "14:18:25", kind: "tool", text: "list_dir: web/app/shop/p/[slug]" },
  { time: "14:18:31", kind: "tool", text: "grep: 'export function Modal' (1 eşleşme)" },
  { time: "14:18:42", kind: "write", text: "Oluşturuldu: size-modal.tsx (86 satır)" },
  { time: "14:19:04", kind: "write", text: "Edit: page.tsx (+8 satır)" },
  { time: "14:19:18", kind: "tool", text: "finish: Beden tablosu modal'ı eklendi." },
  { time: "14:19:21", kind: "ok", text: "TypeScript: 0 hata" },
  { time: "14:19:25", kind: "ok", text: "RSC lint: temiz" },
  { time: "14:19:48", kind: "test", text: "Playwright: 9/9 spec geçti" },
  { time: "14:19:51", kind: "ok", text: "Commit · agent: Beden tablosu modal'ı" },
  { time: "14:19:55", kind: "ok", text: "Tunnel hazır → onayına sunuldu" },
];

const KIND_STYLE: Record<Step["kind"], { dot: string; label: string; cls: string }> = {
  think: { dot: "bg-indigo-400", label: "think", cls: "text-indigo-300" },
  tool: { dot: "bg-sky-400", label: "tool", cls: "text-sky-300" },
  write: { dot: "bg-fuchsia-400", label: "write", cls: "text-fuchsia-300" },
  test: { dot: "bg-violet-400", label: "test", cls: "text-violet-300" },
  ok: { dot: "bg-emerald-400", label: "ok", cls: "text-emerald-300" },
};

// ───────────── Real example tasks ─────────────

const EXAMPLE_TASKS = [
  {
    title: "Anasayfa hero bahar koleksiyon banner'ı",
    scope: "shop_home",
    iter: 5,
    files: 1,
    duration: "5 dk",
  },
  {
    title: "Sipariş listesinde toplu kargo aksiyonu",
    scope: "admin_orders",
    iter: 7,
    files: 3,
    duration: "7 dk",
  },
  {
    title: "Ürün detayında beden tablosu modal'ı",
    scope: "shop_product",
    iter: 8,
    files: 2,
    duration: "8 dk",
  },
  {
    title: "Müşteri detayında son sipariş özet kartı",
    scope: "admin_customers",
    iter: 6,
    files: 2,
    duration: "6 dk",
  },
];

// ───────────── Stats ─────────────

const FACTS = [
  { v: "23", label: "yazılabilir scope" },
  { v: "67", label: "e2e Playwright spec" },
  { v: "5", label: "aşamalı pipeline" },
  { v: "100%", label: "izole worktree" },
];

// ───────────── Component ─────────────

export type RealAgentTask = {
  title: string;
  scope: string;
  iter: number;
  files: number;
  duration: string;
};

export function AiDeveloperSection({
  realTasks,
}: {
  /** Server tarafından geçirilen gerçek MERGED task'lar; verilmezse mock. */
  realTasks?: RealAgentTask[];
}) {
  const TASKS = realTasks && realTasks.length > 0 ? realTasks : EXAMPLE_TASKS;
  return (
    <section
      id="ai-developer"
      className="relative overflow-hidden border-t border-white/[0.06] py-24 sm:py-28"
    >
      {/* Decorative gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.06),transparent_55%)]"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* ─── Header ─── */}
        <div className="text-center">
          <FlagshipBadge />
          <h2 className="mt-7 text-balance text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
            Sen{" "}
            <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
              düşün.
            </span>{" "}
            AI{" "}
            <span className="bg-gradient-to-br from-fuchsia-300 via-rose-300 to-amber-300 bg-clip-text text-transparent">
              kodlasın.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/65 sm:text-lg">
            Doğal dilde görevi yaz —{" "}
            <span className="text-white">
              "şu sayfaya şu butonu ekle"
            </span>
            . Agent planlar, kodlar, test eder, önizleme açar.{" "}
            <span className="text-white">Sen sadece onaylarsın.</span>
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/45">
            CommerceOS, <em className="not-italic font-medium text-white/75">kendi kodu üzerinde</em>{" "}
            agent ile geliştirme yapan ilk e-ticaret yönetim panelidir.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/admin/agent">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90"
              >
                Demo panele git
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#ai-dev-pipeline">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/[0.05] text-white backdrop-blur hover:bg-white/[0.12] hover:text-white"
              >
                Nasıl çalışıyor?
              </Button>
            </a>
          </div>
        </div>

        {/* ─── Pipeline 4 aşama ─── */}
        <div id="ai-dev-pipeline" className="mt-20 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((s, i) => (
            <PipelineCard key={s.label} stage={s} index={i + 1} />
          ))}
        </div>

        {/* ─── Live timeline + summary ─── */}
        <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <LiveTimelineCard />
          <SummaryCard />
        </div>

        {/* ─── Real example tasks ─── */}
        <div className="mt-16 mb-8 text-center">
          <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Gerçek{" "}
            <span className="bg-gradient-to-br from-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              tamamlanmış görevler
            </span>
          </h3>
          <p className="mt-2 text-sm text-white/55">
            Hepsi izole branch'te, tsc temiz, e2e geçmiş, main'e merge edilmiş.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {TASKS.map((t) => (
            <TaskCard key={t.title} task={t} />
          ))}
        </div>

        {/* ─── Stats ─── */}
        <div className="mt-14 grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 sm:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.label} className="text-center">
              <div className="bg-gradient-to-br from-fuchsia-300 to-indigo-300 bg-clip-text font-mono text-3xl font-bold tabular-nums text-transparent">
                {f.v}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/50">
                {f.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────── Sub-components ─────────────

/**
 * 4 aşamalı pipeline grid'i — başka sayfalarda (watch) tek client component
 * olarak import edilebilsin. RSC boundary'sini burada bitir.
 */
export function PipelineGrid({ className }: { className?: string }) {
  return (
    <div
      id="ai-dev-pipeline"
      className={className ?? "mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4"}
    >
      {STAGES.map((s, i) => (
        <PipelineCard key={s.label} stage={s} index={i + 1} />
      ))}
    </div>
  );
}

export function FlagshipBadge() {
  return (
    <div className="inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-white/45">
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-fuchsia-400/50" />
      <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-2.5 py-1 text-fuchsia-200">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
        </span>
        Flagship · AI Geliştirici
      </span>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-fuchsia-400/50" />
    </div>
  );
}

export function PipelineCard({
  stage,
  index,
}: {
  stage: (typeof STAGES)[number];
  index: number;
}) {
  const c = ACCENT_STYLE[stage.accent];
  const Icon = stage.icon;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-b ${c.glow} via-white/[0.02] to-transparent p-5 backdrop-blur transition hover:border-opacity-50 hover:bg-white/[0.04]`}
    >
      <div className="absolute right-3 top-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-white/30">
        0{index}
      </div>
      <div
        className={`grid h-11 w-11 place-items-center rounded-xl ${c.bg} ${c.text} ring-1 ${c.ring}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 font-semibold tracking-tight">{stage.label}</div>
      <div className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-mono font-medium ${c.chip}`}>
        {stage.model}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-white/60">{stage.desc}</p>
    </div>
  );
}

function LiveTimelineCard() {
  // Sahte "şu an çalışıyor" hissi — son satır yanıp sönsün
  const [cursor, setCursor] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setCursor((v) => !v), 700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/40 via-black/20 to-transparent backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
          <Terminal className="h-3.5 w-3.5 text-emerald-300" />
          Canlı agent timeline
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          running
        </div>
      </div>

      <div className="max-h-[26rem] overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed">
        {TIMELINE.map((s, i) => {
          const k = KIND_STYLE[s.kind];
          const isLast = i === TIMELINE.length - 1;
          return (
            <div
              key={i}
              className="grid grid-cols-[64px_60px_1fr] items-baseline gap-2 border-b border-white/[0.03] py-1.5 last:border-0"
            >
              <span className="text-white/30">{s.time}</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${k.cls}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${k.dot}`} />
                {k.label}
              </span>
              <span className="truncate text-white/80">
                {s.text}
                {isLast && (
                  <span
                    className={`ml-1 inline-block h-3.5 w-1.5 align-middle bg-emerald-400 ${
                      cursor ? "opacity-100" : "opacity-0"
                    }`}
                  />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-fuchsia-500/[0.06] via-indigo-500/[0.04] to-emerald-500/[0.06] p-6 backdrop-blur">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
        <Workflow className="h-3.5 w-3.5 text-fuchsia-300" />
        Çıktı
      </div>
      <h4 className="mt-3 text-balance text-2xl font-semibold leading-tight">
        İzole branch · TSC temiz · e2e geçer · önizleme açık
      </h4>
      <p className="mt-4 text-sm leading-relaxed text-white/65">
        Her görev kendi git worktree'sinde çalışır.
        Yetkili scope dışına yazma denenirse tool reddeder.
        Hatalı build commit'lenmez.
      </p>

      <div className="mt-6 space-y-2">
        <CheckRow text="Doğal dil ile görev tanımı" />
        <CheckRow text="Komponent kataloğu — halüsinasyon yok" />
        <CheckRow text="3+ edit + tsc fail → write_file zorlaması" />
        <CheckRow text="Her değişen sayfa için dinamik e2e + screenshot" />
        <CheckRow text="Onay popup'ı · reddet → branch atılır" />
      </div>

      <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white/55">
        <Hammer className="h-3 w-3" />
        Gemini 2.5 Pro + 2.5 Flash
      </div>
    </div>
  );
}

function CheckRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-[13px] leading-relaxed text-white/75">
      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
        <Check className="h-2.5 w-2.5" />
      </span>
      <span>{text}</span>
    </div>
  );
}

function TaskCard({ task }: { task: RealAgentTask }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-white/15 hover:bg-white/[0.04]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-500/10 opacity-0 blur-2xl transition group-hover:opacity-100"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium tracking-tight">{task.title}</div>
          <div className="mt-1 font-mono text-[10px] text-white/40">{task.scope}</div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
          <CheckCircle2 className="h-3 w-3" />
          Yayında
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-3 text-center">
        <Metric label="iterasyon" value={String(task.iter)} />
        <Metric label="dosya" value={String(task.files)} />
        <Metric label="süre" value={task.duration} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-base font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[9px] uppercase tracking-wider text-white/40">
        {label}
      </div>
    </div>
  );
}

// Re-export Zap-styled badge alias if needed (avoids unused imports lint)
export const _z = { Zap };
