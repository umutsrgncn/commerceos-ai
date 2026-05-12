import Link from "next/link";
import { Bot, CheckCircle2, ChevronRight, Clock, Hammer, Loader2, XCircle } from "lucide-react";
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
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
          <Bot className="h-3.5 w-3.5" />
          Gemini Autonomous Coding Agent
        </div>
        <h1 className="text-2xl font-semibold leading-tight">AI Geliştirici</h1>
        <p className="max-w-2xl text-sm text-[color:var(--color-muted)]">
          Yapmasını istediğin işi yaz. Agent kodu analiz eder, plan çıkarır,
          izole bir branch'te uygular, e2e testleri çalıştırır ve önizleme
          tüneliyle onayına sunar.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Toplam" value={stats.total} icon={Hammer} accent="text-[color:var(--color-fg)]" />
        <StatTile label="Çalışıyor" value={stats.running} icon={Loader2} accent="text-blue-500" />
        <StatTile label="Onay bekliyor" value={stats.review} icon={Clock} accent="text-amber-500" />
        <StatTile label="Yayında" value={stats.merged} icon={CheckCircle2} accent="text-emerald-500" />
      </div>

      {/* New task */}
      <NewAgentTaskForm />

      {/* List */}
      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]">
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-3">
          <h2 className="text-sm font-semibold">Son task'lar</h2>
          <span className="text-xs text-[color:var(--color-muted)]">{tasks.length} kayıt</span>
        </div>
        {tasks.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[color:var(--color-muted)]">
            Henüz task yok. Yukarıdaki formdan ilkini gir.
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--color-border)]">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/agent/${t.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-[color:var(--color-fg)]/[0.03]"
                >
                  <StatusBadge status={t.status} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{t.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[color:var(--color-muted)]">
                      {t.branchName && (
                        <span className="font-mono">⎇ {t.branchName}</span>
                      )}
                      <span>{formatRelativeTime(t.createdAt)}</span>
                      {t._count.events > 0 && (
                        <span>{t._count.events} olay</span>
                      )}
                      {t._count.testRuns > 0 && (
                        <span>{t._count.testRuns} test</span>
                      )}
                      {t.iterations > 0 && (
                        <span className="font-mono">{t.iterations} iter</span>
                      )}
                    </div>
                  </div>
                  {t.tunnelUrl && (
                    <span className="hidden rounded-md border border-[color:var(--color-border)] px-2 py-0.5 font-mono text-[10px] text-[color:var(--color-muted)] sm:inline">
                      preview
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-[color:var(--color-muted)]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">{label}</span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
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
  CANCELLED: { label: "Durduruldu", cls: "bg-stone-500/15 text-stone-600 dark:text-stone-300" },
  FAILED: { label: "Hata", cls: "bg-rose-500/20 text-rose-700 dark:text-rose-300" },
};

function StatusBadge({ status }: { status: AgentTaskStatus }) {
  const m = STATUS_META[status];
  const running = status === "PLANNING" || status === "RUNNING" || status === "TESTING";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${m.cls}`}>
      {running ? <Loader2 className="h-3 w-3 animate-spin" /> : status === "FAILED" ? <XCircle className="h-3 w-3" /> : null}
      {m.label}
    </span>
  );
}
