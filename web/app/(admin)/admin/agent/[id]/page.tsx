import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  GitBranch,
  Hash,
  Hourglass,
  ScrollText,
  XCircle,
} from "lucide-react";
import type { AgentTaskStatus } from "@prisma/client";

import { getAgentTask } from "@/lib/agent/queries";
import { formatRelativeTime } from "@/lib/format";
import { ActionsBar } from "./actions-bar";
import { EventTimeline } from "./event-timeline";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getAgentTask(id);
  return { title: task ? `${task.title} — Agent` : "Agent task" };
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getAgentTask(id);
  if (!task) notFound();

  const meta = STATUS_META[task.status];

  return (
    <div className="space-y-5">
      <Link
        href="/admin/agent"
        className="inline-flex items-center gap-1.5 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tüm task'lar
      </Link>

      {/* Hero header */}
      <div
        className={`relative overflow-hidden rounded-2xl border border-[color:var(--color-border)] ${meta.heroBg} p-6`}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${meta.heroBlur}`}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <StatusPill status={task.status} />
              <span className="font-mono text-[11px] text-[color:var(--color-muted)]">
                #{task.id.slice(-8)}
              </span>
            </div>
            <h1 className="mt-3 flex items-start gap-2.5 text-2xl font-semibold leading-tight">
              <Bot className="mt-1 h-5 w-5 shrink-0 text-[color:var(--color-accent)]" />
              {task.title}
            </h1>
          </div>
          <ActionsBar
            id={task.id}
            status={task.status}
            tunnelUrl={task.tunnelUrl}
            port={task.port}
            cancelRequested={task.cancelRequested}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-5">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          <ScrollText className="h-3.5 w-3.5" />
          Verilen görev
        </h2>
        <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-fg)]/90">
          {task.prompt}
        </p>
      </div>

      {/* Meta grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetaTile
          icon={GitBranch}
          label="Branch"
          value={task.branchName?.replace("agent/", "") ?? "—"}
          mono
          accent="indigo"
        />
        <MetaTile
          icon={Hash}
          label="Iterations"
          value={String(task.iterations)}
          mono
          accent="blue"
        />
        <MetaTile
          icon={Hash}
          label="Token"
          value={task.tokensUsed.toLocaleString("tr-TR")}
          mono
          accent="violet"
        />
        <MetaTile
          icon={Hourglass}
          label={task.completedAt ? "Tamamlandı" : "Başlatıldı"}
          value={formatRelativeTime(task.completedAt ?? task.startedAt ?? task.createdAt)}
          accent="emerald"
        />
      </div>

      {task.errorMsg && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.05] p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-300">
            <XCircle className="h-3.5 w-3.5" />
            Hata
          </div>
          <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs text-rose-700 dark:text-rose-300">
            {task.errorMsg}
          </pre>
        </div>
      )}

      {/* Test results */}
      {task.testRuns.length > 0 && (
        <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-5">
          <h2 className="text-sm font-semibold">Test sonuçları</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {task.testRuns.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md border border-[color:var(--color-border)] px-3 py-2"
              >
                <span className="font-mono text-xs">{t.name}</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    t.status === "PASSED"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                      : t.status === "FAILED"
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                      : "bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]"
                  }`}
                >
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {task.screenshots.length > 0 && (
        <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-5">
          <h2 className="text-sm font-semibold">Ekran görüntüleri</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {task.screenshots.map((s) => (
              <figure
                key={s.id}
                className="overflow-hidden rounded-lg border border-[color:var(--color-border)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.path} alt={s.label} className="block w-full" />
                <figcaption className="px-2 py-1 text-[11px] text-[color:var(--color-muted)]">
                  {s.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Event timeline */}
      <section className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]">
        <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] px-5 py-3">
          <h2 className="text-sm font-semibold">Olay akışı</h2>
          <p className="mt-0.5 text-[11px] text-[color:var(--color-muted)]">
            Agent neyi yaptığını burada anlatır. Kod gözükmez — sadece eylemler.
          </p>
        </div>
        <EventTimeline taskId={task.id} initialEvents={task.events} />
      </section>
    </div>
  );
}

const META_ACCENT: Record<
  string,
  { iconBg: string; valueText: string }
> = {
  indigo: {
    iconBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
    valueText: "text-indigo-700 dark:text-indigo-300",
  },
  blue: {
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
    valueText: "text-blue-700 dark:text-blue-300",
  },
  violet: {
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    valueText: "text-violet-700 dark:text-violet-300",
  },
  emerald: {
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    valueText: "text-emerald-700 dark:text-emerald-300",
  },
};

function MetaTile({
  icon: Icon,
  label,
  value,
  mono,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  accent: keyof typeof META_ACCENT;
}) {
  const c = META_ACCENT[accent];
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-4">
      <div className="flex items-center gap-2">
        <span className={`grid h-7 w-7 place-items-center rounded-md ${c.iconBg}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          {label}
        </span>
      </div>
      <div className={`mt-2 truncate text-base font-semibold ${mono ? "font-mono" : ""} ${c.valueText}`}>
        {value}
      </div>
    </div>
  );
}

const STATUS_META: Record<
  AgentTaskStatus,
  { label: string; cls: string; dot?: string; heroBg: string; heroBlur: string }
> = {
  PENDING: {
    label: "Sırada",
    cls: "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-muted)]",
    dot: "bg-[color:var(--color-muted)]",
    heroBg: "bg-gradient-to-br from-[color:var(--color-fg)]/[0.04] to-[color:var(--color-bg)]",
    heroBlur: "bg-stone-400/10",
  },
  PLANNING: {
    label: "Planlıyor",
    cls: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
    dot: "bg-indigo-500",
    heroBg: "bg-gradient-to-br from-indigo-500/[0.08] via-[color:var(--color-bg)] to-[color:var(--color-bg)]",
    heroBlur: "bg-indigo-400/15",
  },
  RUNNING: {
    label: "Çalışıyor",
    cls: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
    dot: "bg-blue-500",
    heroBg: "bg-gradient-to-br from-blue-500/[0.08] via-[color:var(--color-bg)] to-[color:var(--color-bg)]",
    heroBlur: "bg-blue-400/15",
  },
  TESTING: {
    label: "Test ediyor",
    cls: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    dot: "bg-violet-500",
    heroBg: "bg-gradient-to-br from-violet-500/[0.08] via-[color:var(--color-bg)] to-[color:var(--color-bg)]",
    heroBlur: "bg-violet-400/15",
  },
  REVIEW: {
    label: "Onay bekliyor",
    cls: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    dot: "bg-amber-500",
    heroBg: "bg-gradient-to-br from-amber-500/[0.1] via-[color:var(--color-bg)] to-[color:var(--color-bg)]",
    heroBlur: "bg-amber-400/15",
  },
  MERGED: {
    label: "Yayında",
    cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    dot: "bg-emerald-500",
    heroBg: "bg-gradient-to-br from-emerald-500/[0.08] via-[color:var(--color-bg)] to-[color:var(--color-bg)]",
    heroBlur: "bg-emerald-400/15",
  },
  REJECTED: {
    label: "Reddedildi",
    cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
    dot: "bg-rose-500",
    heroBg: "bg-gradient-to-br from-rose-500/[0.06] via-[color:var(--color-bg)] to-[color:var(--color-bg)]",
    heroBlur: "bg-rose-400/12",
  },
  CANCELLED: {
    label: "Durduruldu",
    cls: "bg-stone-500/15 text-stone-600 dark:text-stone-300",
    dot: "bg-stone-500",
    heroBg: "bg-gradient-to-br from-stone-500/[0.05] via-[color:var(--color-bg)] to-[color:var(--color-bg)]",
    heroBlur: "bg-stone-400/10",
  },
  FAILED: {
    label: "Hata",
    cls: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-600",
    heroBg: "bg-gradient-to-br from-rose-500/[0.08] via-[color:var(--color-bg)] to-[color:var(--color-bg)]",
    heroBlur: "bg-rose-500/15",
  },
};

function StatusPill({ status }: { status: AgentTaskStatus }) {
  const m = STATUS_META[status];
  const running = status === "PLANNING" || status === "RUNNING" || status === "TESTING";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}>
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
