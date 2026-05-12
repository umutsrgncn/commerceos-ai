import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Hash,
  Hourglass,
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

  return (
    <div className="space-y-5">
      <Link
        href="/admin/agent"
        className="inline-flex items-center gap-1.5 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tüm task'lar
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusPill status={task.status} />
            <span className="font-mono text-[11px] text-[color:var(--color-muted)]">
              #{task.id.slice(-8)}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold leading-tight">
            {task.title}
          </h1>
        </div>
        <ActionsBar id={task.id} status={task.status} tunnelUrl={task.tunnelUrl} />
      </div>

      {/* Prompt */}
      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          Verilen görev
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-fg)]/90">
          {task.prompt}
        </p>
      </div>

      {/* Meta grid */}
      <div className="grid gap-3 sm:grid-cols-4">
        <MetaTile
          icon={GitBranch}
          label="Branch"
          value={task.branchName ?? "—"}
          mono
        />
        <MetaTile
          icon={Hash}
          label="Iterations"
          value={String(task.iterations)}
          mono
        />
        <MetaTile icon={Hash} label="Token" value={task.tokensUsed.toLocaleString("tr-TR")} mono />
        <MetaTile
          icon={Hourglass}
          label="Oluşturuldu"
          value={formatRelativeTime(task.createdAt)}
        />
      </div>

      {/* Test results & screenshots placeholder */}
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
              <figure key={s.id} className="overflow-hidden rounded-lg border border-[color:var(--color-border)]">
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
      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]">
        <div className="border-b border-[color:var(--color-border)] px-5 py-3">
          <h2 className="text-sm font-semibold">Olay akışı</h2>
          <p className="mt-0.5 text-[11px] text-[color:var(--color-muted)]">
            Agent neyi yaptığını burada anlatır. Kod gözükmez.
          </p>
        </div>
        <EventTimeline taskId={task.id} initialEvents={task.events} />
      </section>
    </div>
  );
}

function MetaTile({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3.5">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={`mt-1 truncate text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

const STATUS_META: Record<AgentTaskStatus, { label: string; cls: string }> = {
  PENDING: { label: "Sırada", cls: "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-muted)]" },
  PLANNING: { label: "Planlıyor", cls: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300" },
  RUNNING: { label: "Çalışıyor", cls: "bg-blue-500/15 text-blue-600 dark:text-blue-300" },
  TESTING: { label: "Test ediyor", cls: "bg-violet-500/15 text-violet-600 dark:text-violet-300" },
  REVIEW: { label: "Onay bekliyor", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  MERGED: { label: "Yayında", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  REJECTED: { label: "Reddedildi", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300" },
  FAILED: { label: "Hata", cls: "bg-rose-500/20 text-rose-700 dark:text-rose-300" },
};

function StatusPill({ status }: { status: AgentTaskStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}
