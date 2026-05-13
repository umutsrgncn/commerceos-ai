import Link from "next/link";
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  Hammer,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { AgentTaskStatus } from "@prisma/client";

import { listAgentTaskStats, listAgentTasks } from "@/lib/agent/queries";
import { formatRelativeTime } from "@/lib/format";
import { NewAgentTaskForm } from "./new-task-form";

export const metadata = { title: "AI Geliştirici — CommerceOS" };
export const dynamic = "force-dynamic";

export default async function AgentListPage() {
  const [tasks, stats] = await Promise.all([listAgentTasks({ limit: 50 }), listAgentTaskStats()]);

  return (
    <div className="space-y-6">
      {/* Header — eye-catcher */}
      <div className="relative overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-gradient-to-br from-fuchsia-500/[0.08] via-indigo-500/[0.04] to-emerald-500/[0.06] p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg)]/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)] backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
              </span>
              Gemini 2.5 Pro · Autonomous Coding
            </div>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-semibold leading-tight">
              <Bot className="h-6 w-6 text-[color:var(--color-accent)]" />
              AI Geliştirici
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--color-muted)]">
              Yapmasını istediğin işi yaz. Agent kodu analiz eder, plan çıkarır,
              izole bir branch'te uygular, e2e testleri çalıştırır ve önizleme
              tüneliyle onayına sunar.
            </p>
          </div>
        </div>
      </div>

      {/* Stats — renkli */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Toplam"
          value={stats.total}
          icon={Hammer}
          accent="stone"
        />
        <StatTile
          label="Çalışıyor"
          value={stats.running}
          icon={Loader2}
          accent="blue"
          live
        />
        <StatTile
          label="Onay bekliyor"
          value={stats.review}
          icon={Clock}
          accent="amber"
        />
        <StatTile
          label="Yayında"
          value={stats.merged}
          icon={CheckCircle2}
          accent="emerald"
        />
      </div>

      {/* New task */}
      <NewAgentTaskForm />

      {/* List */}
      <section className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]">
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-accent)]" />
            <h2 className="text-sm font-semibold">Son task'lar</h2>
          </div>
          <span className="rounded-full bg-[color:var(--color-fg)]/[0.06] px-2 py-0.5 font-mono text-[10px] tabular-nums text-[color:var(--color-muted)]">
            {tasks.length}
          </span>
        </div>
        {tasks.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.04] text-[color:var(--color-muted)]">
              <Bot className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm text-[color:var(--color-muted)]">
              Henüz task yok. Yukarıdaki formdan ilkini gir.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--color-border)]">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/agent/${t.id}`}
                  className="group flex items-center gap-4 px-5 py-3.5 transition hover:bg-[color:var(--color-fg)]/[0.03]"
                >
                  <StatusBadge status={t.status} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{t.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[color:var(--color-muted)]">
                      {t.branchName && (
                        <span className="font-mono">⎇ {t.branchName.replace("agent/", "")}</span>
                      )}
                      <span>{formatRelativeTime(t.createdAt)}</span>
                      {t._count.events > 0 && (
                        <span>{t._count.events} olay</span>
                      )}
                      {t.iterations > 0 && (
                        <span className="font-mono">{t.iterations} iter</span>
                      )}
                      {t.tokensUsed > 0 && (
                        <span className="font-mono">{t.tokensUsed.toLocaleString("tr-TR")} tok</span>
                      )}
                    </div>
                  </div>
                  {t.tunnelUrl && t.status === "REVIEW" && (
                    <span className="hidden rounded-md border border-amber-500/30 bg-amber-500/[0.08] px-2 py-0.5 font-mono text-[10px] text-amber-600 dark:text-amber-300 sm:inline">
                      preview hazır
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-[color:var(--color-muted)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--color-fg)]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const ACCENT_CFG: Record<
  string,
  { bg: string; ring: string; text: string; iconBg: string }
> = {
  stone: {
    bg: "bg-stone-500/[0.04]",
    ring: "ring-stone-500/15",
    text: "text-stone-700 dark:text-stone-300",
    iconBg: "bg-stone-500/15 text-stone-600 dark:text-stone-300",
  },
  blue: {
    bg: "bg-blue-500/[0.06]",
    ring: "ring-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  },
  amber: {
    bg: "bg-amber-500/[0.06]",
    ring: "ring-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  },
  emerald: {
    bg: "bg-emerald-500/[0.06]",
    ring: "ring-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  },
};

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
  live,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: keyof typeof ACCENT_CFG;
  live?: boolean;
}) {
  const c = ACCENT_CFG[accent];
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[color:var(--color-border)] ${c.bg} p-4 ring-1 ${c.ring}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          {label}
        </span>
        <span className={`grid h-7 w-7 place-items-center rounded-md ${c.iconBg}`}>
          <Icon className={`h-3.5 w-3.5 ${live && value > 0 ? "animate-spin" : ""}`} />
        </span>
      </div>
      <div className={`mt-2 text-3xl font-bold tabular-nums ${c.text}`}>{value}</div>
    </div>
  );
}

const STATUS_META: Record<AgentTaskStatus, { label: string; cls: string; dot?: string }> = {
  PENDING: {
    label: "Sırada",
    cls: "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-muted)]",
    dot: "bg-[color:var(--color-muted)]",
  },
  PLANNING: {
    label: "Planlıyor",
    cls: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  RUNNING: {
    label: "Çalışıyor",
    cls: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  TESTING: {
    label: "Test ediyor",
    cls: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  REVIEW: {
    label: "Onay bekliyor",
    cls: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  MERGED: {
    label: "Yayında",
    cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Reddedildi",
    cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  CANCELLED: {
    label: "Durduruldu",
    cls: "bg-stone-500/15 text-stone-600 dark:text-stone-300",
    dot: "bg-stone-500",
  },
  REFUSED: {
    label: "Güvenlik tedbiri",
    cls: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  FAILED: {
    label: "Sistem hatası",
    cls: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-600",
  },
};

function StatusBadge({ status }: { status: AgentTaskStatus }) {
  const m = STATUS_META[status];
  const running = status === "PLANNING" || status === "RUNNING" || status === "TESTING";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}
    >
      {running ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${m.dot} opacity-75`} />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${m.dot}`} />
        </span>
      ) : status === "FAILED" ? (
        <XCircle className="h-3 w-3" />
      ) : status === "MERGED" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      )}
      {m.label}
    </span>
  );
}
